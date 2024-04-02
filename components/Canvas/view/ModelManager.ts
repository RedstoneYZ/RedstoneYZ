import { BlockStates, SixSides, ThreeAxes, Vector2, Vector3, Vector4 } from "../model/types";
import BlockStatesManager from "./BlockStatesManager";
import { BlockModel, BlockModelFace } from "./types";

export default class ModelManager {
  private blockStatesManager: BlockStatesManager;
  private rawModelCache: { [key: string]: RawBlockModel };
  private modelCache: { [key: string]: BlockModel };

  constructor() {
    this.blockStatesManager = new BlockStatesManager();
    this.rawModelCache = {};
    this.modelCache = {
      ["air"]: {
        ambientocclusion: false, 
        faces: [], 
        outlines: []
      }
    };
  }

  async get(path: string, states: BlockStates): Promise<BlockModel[]> {
    const result = (await this.blockStatesManager.get(path, states))
      .map(pack => {
        if (pack.length === 1) return pack[0];
        let rand = Math.random() * pack.reduce((a, c) => a + c.weight, 0);
        for (const item of pack) {
          rand -= item.weight;
          if (rand <= 0) {
            return item;
          }
        }
        return pack[0];
      })
      .map(async bs => {
        const rotateX = this.getRotationMatrix({ origin: [8, 8, 8], axis: "x", angle: bs.x });
        const rotateY = this.getRotationMatrix({ origin: [8, 8, 8], axis: "y", angle: bs.y });
        const rotate0 = (vec: Vector3) => rotateY([...rotateX([...vec, 0]), 0]);
        const rotate1 = (vec: Vector3) => rotateY([...rotateX([...vec, 1]), 1]);

        const model = await this.getModel(bs.model);
        const faces: BlockModelFace[] = model.faces.map(face => ({
          corners: face.corners.map(rotate1) as [Vector3, Vector3, Vector3, Vector3], 
          texCords: face.texCords, // TODO
          normal: rotate0(face.normal),
          shade: face.shade,
          texture: face.texture,
          cullface: face.cullface, // TODO
          tintindex: face.tintindex,
        }));
        const outlines: Vector3[][] = model.outlines.map(outline => outline.map(rotate1));
        return { ambientocclusion: model.ambientocclusion, faces, outlines };
      });
    return Promise.all(result);
  }

  private async getModel(path: string): Promise<BlockModel> {
    if (path in this.modelCache) {
      return this.modelCache[path]!;
    }
    else {
      const raw_model = await this.loadRawModel(path);
      return this.modelCache[path] = await this.parseModel(raw_model);
    }
  }

  private async loadRawModel(path: string): Promise<RawBlockModel> {
    if (path in this.rawModelCache) {
      return this.rawModelCache[path]!;
    }

    const model = require(`../../../public/json/blocks/${path}.json`) as RawBlockModel;
    return this.rawModelCache[path] = model;
  }

  private async parseModel(rawModel: RawBlockModel): Promise<BlockModel> {
    const _1 = await this.unfoldModel(rawModel);
    const _2 = this.propagateTexture(_1);
    const _3 = this.clearElement(_2);
    return _3;
  }

  private async unfoldModel(rawModel: RawBlockModel): Promise<FullModel> {
    const result: FullModel = {
      ambientocclusion: rawModel.ambientocclusion ?? true, 
      textures: rawModel.textures ?? {},
      elements: rawModel.elements ?? []
    };

    let parent = rawModel.parent;
    while (parent) {
      const parentData = await this.loadRawModel(this.parsePath(parent));

      result.ambientocclusion &&= parentData.ambientocclusion ?? true;

      if (parentData.textures) {
        result.textures = { ...parentData.textures, ...result.textures };
      }
      if (parentData.elements) {
        result.elements = parentData.elements;
      }

      parent = parentData.parent;
    }

    return result;
  }

  private propagateTexture(model: FullModel): Omit<FullModel, 'textures'> {
    for (let [key, value] of Object.entries(model.textures)) {
      const keys = [key];
      while (value.startsWith("#")) {
        value = value.substring(1);
        keys.push(value);
  
        key = value;
        value = model.textures[key];
      }

      value = this.parsePath(value);
      keys.forEach(k => {
        model.textures[k] = value;
      });
    }

    for (const { faces } of model.elements) {
      for (const key in faces) {
        const face = faces[key as SixSides]!;
        if (face.texture.startsWith('#')) {
          face.texture = model.textures[face.texture.substring(1)];
        }
      }
    }

    return model;
  }

  private clearElement(model: Omit<FullModel, 'textures'>): BlockModel {
    const outlines: Vector3[][] = [];
    const modelFaces: BlockModelFace[] = [];

    model.elements.forEach(({ from, to, rotation, shade, faces }) => {
      const rotate = this.getRotationMatrix(rotation);
      const vertices = this.expandVertices(from, to, rotate);
      const normals = this.getNormals(rotate);

      for (const _key in faces) {
        const key = _key as SixSides;
        const face = faces[key]!;
        const uv = face.uv?.map(v => v / 16) ?? [0, 0, 1, 1];

        const texCords: [Vector2, Vector2, Vector2, Vector2] = 
          [[uv[0], uv[1]], [uv[0], uv[3]], [uv[2], uv[3]], [uv[2], uv[1]]];
        while (face.rotation && face.rotation > 0) {
          texCords.push(texCords.shift()!);
          face.rotation -= 90;
        }

        const { rotated } = vertices;
        const v = this.sixSides[key][0];
        modelFaces.push({
          corners: [rotated[v[0]], rotated[v[1]], rotated[v[2]], rotated[v[3]]], 
          texCords: texCords,
          normal: normals[key],
          shade: shade ?? true,
          texture: face.texture,
          cullface: face.cullface ?? key,
          tintindex: face.tintindex ?? -1,
        });
      }

      // if (!data.outlines?.length) {
        outlines.push(vertices.original);
      // }
    });

    return { faces: modelFaces, outlines, ambientocclusion: model.ambientocclusion };
  }

  private parsePath(path: string): string {
    if (path.startsWith("minecraft:")) {
      path = path.substring(10);
    }
    if (path.startsWith("block/")) {
      path = path.substring(6);
    }
    return path;
  }

  private getRotationMatrix(rotation?: RawBlockModelElementRotation): Rotation {
    if (!rotation) {
      return function ([x, y, z]) {
        return [x, y, z];
      }
    }

    let { origin: [p = 0, q = 0, r = 0] = [0, 0, 0] } = rotation;
    const { axis, angle } = rotation;

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
    ] : [
      c,-s, 0, 
      s, c, 0, 
      0, 0, 1
    ];

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

  private expandVertices(from: Vector3, to: Vector3, rotate: Rotation): { original: Vector3[], rotated: Vector3[] } {
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

  private getNormals(rotate: Rotation): Record<SixSides, Vector3> {
    return {
      east: rotate([1, 0, 0, 0]), 
      west: rotate([-1, 0, 0, 0]), 
      up: rotate([0, 1, 0, 0]), 
      down: rotate([0, -1, 0, 0]), 
      south: rotate([0, 0, 1, 0]), 
      north: rotate([0, 0, -1, 0])
    };
  }

  private sixSides = {
    up: [[2, 3, 7, 6], [0, 1, 0]], 
    west: [[2, 0, 1, 3], [-1, 0, 0]], 
    east: [[7, 5, 4, 6], [1, 0, 0]], 
    south: [[3, 1, 5, 7], [0, 0, 1]], 
    north: [[6, 4, 0, 2], [0, 0, -1]], 
    down: [[1, 0, 4, 5], [0, -1, 0]]
  } as const;
}

type FullModel = Required<Omit<RawBlockModel, 'parent' | 'display'>>;

type Rotation = (vec: Vector4) => Vector3;

/**
 * Refer to https://minecraft.wiki/w/Model
 */
interface RawBlockModel {
  parent?: string;
  ambientocclusion?: boolean;
  display?: never; // currently not used
  textures?: { [texture: string]: string };
  elements?: RawBlockModelElement[]
}

interface RawBlockModelElement {
  from: Vector3;
  to: Vector3;
  rotation?: RawBlockModelElementRotation;
  shade?: boolean;
  faces: Partial<Record<SixSides, RawBlockModelElementFace>>;
}

interface RawBlockModelElementRotation {
  origin: Vector3;
  axis: ThreeAxes;
  angle: number;
  rescale?: boolean;
}

interface RawBlockModelElementFace {
  texture: string;
  uv?: Vector4;
  cullface?: SixSides;
  rotation?: number;
  tintindex?: number;
}
