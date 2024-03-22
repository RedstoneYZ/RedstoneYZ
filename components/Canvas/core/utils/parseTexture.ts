import { Components, ComponentsElement, FaceData, FourFacings, FullBlockData, RawBlockData, RawBlockElementData, RawRotationData, Rotation, SixSides, ThreeFaces, Vector2, Vector3, WebGLData, WebGLTextureData } from "../../typings/types";

/**
 * 將指定方塊的模型資料解析成方便使用的形式
 * @param allData 所有方塊的資料
 * @param blockData 指定方塊的資料
 */
function parseTexture(
  allData: { [name: string]: RawBlockData }, blockData: RawBlockData & { face: boolean, facing: boolean, textures: { [name: string]: string } }
): Record<ThreeFaces, Record<FourFacings, WebGLData>>;
function parseTexture(
  allData: { [name: string]: RawBlockData }, blockData: RawBlockData & { facing: boolean, textures: { [name: string]: string } }
): Record<FourFacings, WebGLData>;
function parseTexture(
  allData: { [name: string]: RawBlockData }, blockData: RawBlockData & { textures: { [name: string]: string } }
): WebGLData;
function parseTexture(
  allData: { [name: string]: RawBlockData }, blockData: RawBlockData & { textures: { [name: string]: string } }
): WebGLData | Record<FourFacings, WebGLData> | Record<ThreeFaces, Record<FourFacings, WebGLData>> {
  const fullRawData = getFullData(allData, blockData);
  const modelComponents = getComponents(fullRawData);
  const data = parseComponents(modelComponents);
  return data;
}

/**
 * 從所有方塊的資料中抓取指定方塊的模型資料
 * @param allData 所有方塊的資料
 * @param blockName 指定方塊的資料
 */
function getFullData(
  allData: { [name: string]: RawBlockData }, blockData: RawBlockData & { face: boolean, facing: boolean, textures: { [name: string]: string } }
): FullBlockData & { face: true, facing: true };
function getFullData(
  allData: { [name: string]: RawBlockData }, blockData: RawBlockData & { facing: boolean, textures: { [name: string]: string } }
): FullBlockData & { facing: true };
function getFullData(
  allData: { [name: string]: RawBlockData }, blockData: RawBlockData & { textures: { [name: string]: string } }
): FullBlockData;
function getFullData(
  allData: { [name: string]: RawBlockData }, blockData: RawBlockData & { textures: { [name: string]: string } }
): FullBlockData {
  const data = flatten(allData, blockData);

  // 把 `#textures` 的值都改成檔名
  for (let [key, value] of Object.entries(data.textures)) {
    const keys = [key];
    while (value.startsWith("#")) {
      value = value.substring(1);
      keys.push(value);

      key = value;
      value = data.textures[key];
    }

    value = parsePath(value);
    keys.forEach(k => {
      data.textures[k] = value;
    });
  }

  // 把 `#elements#faces#*#texture` 的值都根據 `#textures` 改成檔名
  for (const { faces } of data.elements) {
    for (const key in faces) {
      const face = faces[key as keyof typeof faces]!;
      if (!face.texture.startsWith('#')) {
        throw new Error(`The texture string ${face.texture} does not starts with "#".`);
      }
      face.texture = data.textures[face.texture.substring(1)];
    }
  }

  return data;
}

/**
 * 把資料轉換為繪圖所需的各種元件
 */
function getComponents(data: FullBlockData & { face: true, facing: true }): Components & { face: true, facing: true };
function getComponents(data: FullBlockData & { facing: true }): Components & { face: false, facing: true };
function getComponents(data: FullBlockData): Components & { face: false, facing: false };
function getComponents(data: FullBlockData): Components {
  const outlines: Vector3[][] = [];
  const elements = data.elements.map(({ from, to, faces, rotation }) => {
    const rotate = getRotationMatrix(rotation);
    const vertices = getVertices(from as Vector3, to as Vector3, rotate);
    const normals = getNormals(rotate);
    const newFaces: Partial<Record<SixSides, FaceData>> = {};

    for (const key in faces) {
      const face = faces[key as keyof typeof faces]!;
      const uv = face.uv?.map(v => v / 16) ?? [0, 0, 1, 1];
      const texCoord: [Vector2, Vector2, Vector2, Vector2] = 
        [[uv[0], uv[1]], [uv[0], uv[3]], [uv[2], uv[3]], [uv[2], uv[1]]];
      if (face.rotation) {
        if (face.rotation % 90 !== 0) {
          throw new Error('Cannot rotate an image with an angle that is not the multiple of 90.');
        }

        let count = (face.rotation / 90) & 3;
        while (count--) {
          texCoord.push(texCoord.shift()!);
        }
      }

      newFaces[key as keyof typeof faces] = { texCoord, texture: face.texture };
    }

    if (!data.outlines?.length) {
      outlines.push(vertices.original);
    }

    return { vertices: vertices.rotated, normals, faces: newFaces };
  });

  return {
    elements, 
    outlines: data.outlines?.map(({ from, to }) => getVertices(from as Vector3, to as Vector3, getRotationMatrix()).original) ?? outlines, 
    face: data.face ?? false, 
    facing: data.facing ?? false,
    prerotation: data.prerotation ?? 0
  };
}

/**
 * 將所有元件轉換為 WebGL 所需的資料
 */
function parseComponents(param: Components & { face: true, facing: true }): Record<ThreeFaces, Record<FourFacings, WebGLData>>;
function parseComponents(param: Components & { face: false, facing: true }): Record<FourFacings, WebGLData>;
function parseComponents(param: Components & { face: false, facing: false }): WebGLData;
function parseComponents({ elements, outlines, face, facing, prerotation }: Components)
    : WebGLData | Record<FourFacings, WebGLData> | Record<ThreeFaces, Record<FourFacings, WebGLData>> {
  const yRotate = getRotationMatrix({ origin: [8, 8, 8], axis: "y", angle: 90 });

  if (prerotation) {
    for (let i = 0; i < prerotation; i++) {
      rotateElements(elements, yRotate);
      rotateOutlines(outlines, yRotate);
    }
  }

  if (!facing) {
    return getVerticesData(elements, outlines);
  }

  const faces: [ThreeFaces, Rotation[]][] = face ? [
    ['floor', []], 
    ['wall', [getRotationMatrix({ origin: [8, 8, 8], axis: "x", angle: -90 }), getRotationMatrix({ origin: [8, 8, 8], axis: "z", angle: 180 })]], 
    ['ceiling', [getRotationMatrix({ origin: [8, 8, 8], axis: "x", angle: -90 })]]
  ] : [['floor', []]];

  let data: Partial<Record<ThreeFaces, Record<FourFacings, WebGLData>>> = {};

  do {
    const [f, rotates] = faces.shift()!;

    rotates.forEach(r => {
      rotateElements(elements, r);
      rotateOutlines(outlines, r);
    });

    const result: Partial<Record<FourFacings, WebGLData>> = {};

    const facings: FourFacings[] = ['north', 'west', 'south', 'east'];
    facings.forEach(dir => {
      result[dir] = getVerticesData(elements, outlines);
      rotateElements(elements, yRotate);
      rotateOutlines(outlines, yRotate);
    });

    if (face) data[f] = result as Record<FourFacings, WebGLData>;
    else return result as Record<FourFacings, WebGLData>;
  } while (faces.length);

  return data as Record<ThreeFaces, Record<FourFacings, WebGLData>>;
}

/**
 * 把模型箱的所有座標都旋轉一次
 */
function rotateElements(elements: ComponentsElement[], rotate: Rotation): void {
  for (const { vertices, normals } of elements) {
    for (let i = 0; i < vertices.length; i++) {
      vertices[i] = rotate([...vertices[i], 1]);
    }
    for (const key in normals) {
      const k = key as keyof typeof normals;
      normals[k] = rotate([...normals[k], 0]);
    }
  }
}

/**
 * 把互動箱的所有座標都旋轉一次
 */
function rotateOutlines(outlines: Vector3[][], rotate: Rotation): void {
  outlines.forEach(outline => {
    for (let i = 0; i < outline.length; i++) {
      outline[i] = rotate([...outline[i], 1]);
    }
  });
}

/**
 * 把模型箱與互動箱資料轉成可以直接餵給 WebGL 的資料
 */
function getVerticesData(elements: ComponentsElement[], outlinesParam: Vector3[][]): WebGLData {
  const textures: WebGLTextureData[] = [];
  const outlines: number[] = [];
  elements.forEach(({ vertices, normals, faces }) => {
    const texture: Partial<WebGLTextureData> = {};
    
    sixSides.forEach(([dir, v]) => {
      const tex = faces[dir];
      texture[dir] = tex ? {
        source: tex.texture, 
        vertices: [
          ...vertices[v[0]], ...tex.texCoord[0], ...normals[dir], 
          ...vertices[v[1]], ...tex.texCoord[1], ...normals[dir], 
          ...vertices[v[2]], ...tex.texCoord[2], ...normals[dir], 
          ...vertices[v[3]], ...tex.texCoord[3], ...normals[dir]
        ]
      } : undefined;
    });

    outlinesParam.forEach(vertices => {
      sixSides.forEach(([_, v, n]) => {
        outlines.push(
          ...vertices[v[0]], ...n, 
          ...vertices[v[1]], ...n, 
          ...vertices[v[2]], ...n, 
          ...vertices[v[3]], ...n
        );
      });
    });

    textures.push(texture as WebGLTextureData);
  });

  return { textures, outlines };
}

/**
 * 把 data 根據 #parent 展開
 * @param allData 所有方塊的資料
 * @param data 待處理的資料
 */
function flatten(
  allData: { [name: string]: RawBlockData }, data: RawBlockData & { textures: { [name: string]: string } }
): Omit<RawBlockData, "parent"> & { elements: RawBlockElementData[], textures: { [name: string]: string } } {
  let parent = data.parent;
  while (parent) {
    const parentPath = parsePath(parent);
    const parentData = allData[parentPath];
    if (!parentData) {
      throw new Error(`Invalid parent path ${parentPath}`);
    }
    
    if (parentData.textures) {
      data.textures = { ...parentData.textures, ...data.textures };
    }
    if (parentData.elements) {
      data.elements = parentData.elements;
    }
    if (parentData.outlines) {
      data.outlines = parentData.outlines;
    }
    if (parentData.face) {
      data.face = parentData.face;
    }
    if (parentData.facing) {
      data.facing = parentData.facing;
    }
    if (parentData.prerotation) {
      data.prerotation = parentData.prerotation;
    }

    parent = parentData.parent;
  }
  delete data.parent;
  return JSON.parse(JSON.stringify(data));
}

/**
 * 將原始資料中的方塊路徑轉換為名稱
 */
function parsePath(path: string): string {
  if (path.startsWith("minecraft:")) {
    path = path.substring(10);
  }
  if (path.startsWith("block/")) {
    path = path.substring(6);
  }
  return path;
}

/**
 * 產生一個旋轉矩陣的函數
 */
function getRotationMatrix(rotation?: RawRotationData): Rotation {
  if (!rotation) {
    return function ([x, y, z]) {
      return [x, y, z];
    }
  }

  let { origin: [p = 0, q = 0, r = 0] = [0, 0, 0], axis = "x", angle = 0 } = rotation;

  const c = Math.cos(angle / 180 * Math.PI);
  const s = Math.sin(angle / 180 * Math.PI);
  const m = axis === "x" ? [
    1, 0, 0, 
    0, c,-s, 
    0, s, c
  ] : axis === "y" ? [
     c, 0, s, 
     0, 1, 0, 
    -s, 0, c
  ] : axis === "z" ? [
    c,-s, 0, 
    s, c, 0, 
    0, 0, 1
  ] : null;

  if (!m) {
    throw new Error(`Unable to parse axis "${axis}".`);
  }

  p /= 16;
  q /= 16;
  r /= 16;

  return function ([x, y, z, w]) {
    x -= (w ? p : 0);
    y -= (w ? q : 0);
    z -= (w ? r : 0);

    return [
      m[0]*x + m[1]*y + m[2]*z + (w ? p : 0), 
      m[3]*x + m[4]*y + m[5]*z + (w ? q : 0), 
      m[6]*x + m[7]*y + m[8]*z + (w ? r : 0)
    ];
  }
}

/**
 * 回傳 from 到 to 展開的長方體的原座標與旋轉後的座標
 */
function getVertices(from: Vector3, to: Vector3, rotate: Rotation): { original: Vector3[], rotated: Vector3[] } {
  const f = [from[0] / 16, from[1] / 16, from[2] / 16];
  const t = [to[0] / 16, to[1] / 16, to[2] / 16];

  const original: Vector3[] = [
    [f[0], f[1], f[2]], 
    [f[0], f[1], t[2]], 
    [f[0], t[1], f[2]], 
    [f[0], t[1], t[2]], 
    [t[0], f[1], f[2]], 
    [t[0], f[1], t[2]], 
    [t[0], t[1], f[2]], 
    [t[0], t[1], t[2]]
  ];

  return {
    original, 
    rotated: original.map(v => rotate([...v, 1]))
  };
}

/**
 * 回傳旋轉後的三軸單位向量
 */
function getNormals(rotate: Rotation): Record<SixSides, Vector3> {
  return {
    east: rotate([1, 0, 0, 0]), 
    west: rotate([-1, 0, 0, 0]), 
    up: rotate([0, 1, 0, 0]), 
    down: rotate([0, -1, 0, 0]), 
    south: rotate([0, 0, 1, 0]), 
    north: rotate([0, 0, -1, 0])
  };
}

const sixSides = [
  ['up', [2, 3, 7, 6], [0, 1, 0]], 
  ['west', [2, 0, 1, 3], [-1, 0, 0]], 
  ['east', [7, 5, 4, 6], [1, 0, 0]], 
  ['south', [3, 1, 5, 7], [0, 0, 1]], 
  ['north', [6, 4, 0, 2], [0, 0, -1]], 
  ['down', [1, 0, 4, 5], [0, -1, 0]]
] as const;

export default parseTexture;