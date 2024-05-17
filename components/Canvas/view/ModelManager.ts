import type { BlockState, SixSides, ThreeAxes, Vector2, Vector3, Vector4 } from "../model/types";
import BlockStateManager from "./BlockStateManager";
import type { BlockModel, BlockModelFace, BlockOutline } from "./types";
import Matrix4 from "./utils/Matrix4";

export default class ModelManager {
  private blockStatesManager: BlockStateManager;
  private rawModelCache: { [key: string]: RawBlockModel };
  private outlineCache: { [key: string]: BlockOutline[] };
  private modelCache: { [key: string]: BlockModel };

  constructor() {
    this.blockStatesManager = new BlockStateManager();
    this.rawModelCache = {};
    this.outlineCache = {};
    this.modelCache = {
      ["air"]: {
        ambientocclusion: false,
        faces: [],
        outline: [],
      },
    };
  }

  get(path: string, states: BlockState): BlockModel[] {
    return this.blockStatesManager
      .get(path, states)
      .map((pack) => {
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
      .map((bs) => {
        const rotateMat = Matrix4.Multiply(
          Matrix4.Translate(-0.5, -0.5, -0.5),
          Matrix4.RotateX((-bs.x / 180) * Math.PI),
          Matrix4.RotateY((-bs.y / 180) * Math.PI),
          Matrix4.Translate(0.5, 0.5, 0.5),
        );
        const rotate: (v: Vector4) => Vector3 = (v: Vector4) => {
          const [x, y, z] = Matrix4.MultiplyVec(rotateMat, v);
          return [x, y, z];
        };
        const model = this.getModel(bs.model);

        return {
          ambientocclusion: model.ambientocclusion,
          faces: model.faces.map((face) => ({
            corners: face.corners.map((v) => rotate([...v, 1])) as [
              Vector3,
              Vector3,
              Vector3,
              Vector3,
            ],
            texCoord: face.texCoord, // TODO: uvlock
            tangent: [rotate([...face.tangent[0], 0]), rotate([...face.tangent[1], 0])],
            shade: face.shade,
            texture: face.texture,
            cullface: face.cullface ? this.rotateFace(face.cullface, -bs.x, -bs.y) : undefined,
            tintindex: face.tintindex,
          })),
          outline: model.outline.map(({ from, to }) => {
            const _f = rotate([...from, 1]);
            const _t = rotate([...to, 1]);
            const f: Vector3 = [0, 0, 0];
            const t: Vector3 = [0, 0, 0];
            f[0] = _f[0] < _t[0] ? _f[0] : _t[0];
            f[1] = _f[1] < _t[1] ? _f[1] : _t[1];
            f[2] = _f[2] < _t[2] ? _f[2] : _t[2];
            t[0] = _f[0] > _t[0] ? _f[0] : _t[0];
            t[1] = _f[1] > _t[1] ? _f[1] : _t[1];
            t[2] = _f[2] > _t[2] ? _f[2] : _t[2];
            return { from: f, to: t };
          }),
        };
      });
  }

  private getModel(path: string): BlockModel {
    if (path in this.modelCache) {
      return this.modelCache[path];
    }

    const raw_model = this.loadRawModel(path);
    const model = this.parseModel(raw_model);
    const outline = this.getOutline(path);
    if (outline.length > 0) {
      model.outline = outline;
    }

    return (this.modelCache[path] = model);
  }

  private getOutline(path: string): BlockOutline[] {
    if (path in this.outlineCache) {
      return this.outlineCache[path];
    }

    try {
      const outline = require(`../../../public/json/outline/${path}.json`) as BlockOutline[];
      this.outlineCache[path] = outline.map(({ from, to }) => {
        return {
          from: from.map((a) => a / 16) as Vector3,
          to: to.map((a) => a / 16) as Vector3,
        };
      });
    } catch (_) {
      this.outlineCache[path] = [];
    }

    return this.outlineCache[path];
  }

  private loadRawModel(path: string): RawBlockModel {
    if (path in this.rawModelCache) {
      return this.rawModelCache[path];
    }

    const model = require(`../../../public/json/blocks/${path}.json`) as RawBlockModel;
    return (this.rawModelCache[path] = model);
  }

  private parseModel(rawModel: RawBlockModel): BlockModel {
    const _1 = this.unfoldModel(rawModel);
    const _2 = this.propagateTexture(_1);
    const _3 = this.clearElement(_2);
    return _3;
  }

  private unfoldModel(rawModel: RawBlockModel): FullModel {
    const result: FullModel = {
      ambientocclusion: rawModel.ambientocclusion ?? true,
      textures: rawModel.textures ?? {},
      elements: rawModel.elements ?? [],
    };

    let parent = rawModel.parent;
    while (parent) {
      const parentData = this.loadRawModel(this.parsePath(parent));

      result.ambientocclusion &&= parentData.ambientocclusion ?? true;

      if (parentData.textures) {
        result.textures = deepCopy({ ...parentData.textures, ...result.textures });
      }
      if (parentData.elements) {
        result.elements = deepCopy(parentData.elements);
      }

      parent = parentData.parent;
    }

    return result;
  }

  private propagateTexture(model: FullModel): Omit<FullModel, "textures"> {
    for (let [key, value] of Object.entries(model.textures)) {
      const keys = [key];
      while (value.startsWith("#")) {
        value = value.substring(1);
        keys.push(value);

        key = value;
        value = model.textures[key];
      }

      value = this.parsePath(value);
      keys.forEach((k) => {
        model.textures[k] = value;
      });
    }

    for (const { faces } of model.elements) {
      for (const key in faces) {
        const face = faces[key as SixSides]!;
        if (face.texture.startsWith("#")) {
          face.texture = model.textures[face.texture.substring(1)];
        }
      }
    }

    return model;
  }

  private clearElement(model: Omit<FullModel, "textures">): BlockModel {
    const outline: BlockOutline[] = [];
    const modelFaces: BlockModelFace[] = [];

    model.elements.forEach(({ from, to, rotation, shade, faces }) => {
      const rotate = this.getRotationMatrix(rotation);
      const vertices = this.expandVertices(from, to, rotate);
      const tangent = this.getTangent(rotate);

      for (const _key in faces) {
        const key = _key as SixSides;
        const face = faces[key]!;
        const uv = face.uv ?? [0, 0, 16, 16];

        const texCoord: [Vector2, Vector2, Vector2, Vector2] = [
          [uv[0], uv[1]],
          [uv[0], uv[3]],
          [uv[2], uv[3]],
          [uv[2], uv[1]],
        ];
        while (face.rotation && face.rotation > 0) {
          texCoord.push(texCoord.shift()!);
          face.rotation -= 90;
        }

        const v = this.sixSides[key][0];
        modelFaces.push({
          corners: [vertices[v[0]], vertices[v[1]], vertices[v[2]], vertices[v[3]]],
          texCoord: texCoord,
          tangent: [tangent.u[key], tangent.v[key]],
          shade: shade ?? true,
          texture: face.texture,
          cullface: face.cullface,
          tintindex: face.tintindex ?? -1,
        });
      }

      outline.push({
        from: from.map((a) => a / 16) as Vector3,
        to: to.map((a) => a / 16) as Vector3,
      });
    });

    return {
      ambientocclusion: model.ambientocclusion,
      faces: modelFaces,
      outline,
    };
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

  private rotateFace(face: SixSides, x: number, y: number): SixSides {
    const xFaces: SixSides[] = ["south", "down", "north", "up"];
    const yFaces: SixSides[] = ["south", "east", "north", "west"];

    let index = xFaces.findIndex((v) => v === face);
    if (index >= 0) {
      index += x / 90 + 4;
      index = index >= 4 ? index - 4 : index;
      face = xFaces[index];
    }

    index = yFaces.findIndex((v) => v === face);
    if (index >= 0) {
      index += y / 90 + 4;
      index = index >= 4 ? index - 4 : index;
      face = yFaces[index];
    }

    return face;
  }

  private getRotationMatrix(rotation?: RawBlockModelElementRotation): Rotation {
    if (!rotation) {
      return function ([x, y, z]) {
        return [x, y, z];
      };
    }

    let { origin: [p = 0, q = 0, r = 0] = [0, 0, 0] } = rotation;
    const { axis, angle } = rotation;

    const c = Math.cos((angle / 180) * Math.PI);
    const s = Math.sin((angle / 180) * Math.PI);
    const m =
      axis === "x"
        ? [1, 0, 0, 0, c, -s, 0, s, c]
        : axis === "y"
          ? [c, 0, s, 0, 1, 0, -s, 0, c]
          : [c, -s, 0, s, c, 0, 0, 0, 1];

    p /= 16;
    q /= 16;
    r /= 16;

    return function ([x, y, z, w]) {
      x -= w ? p : 0;
      y -= w ? q : 0;
      z -= w ? r : 0;

      return [
        m[0] * x + m[1] * y + m[2] * z + (w ? p : 0),
        m[3] * x + m[4] * y + m[5] * z + (w ? q : 0),
        m[6] * x + m[7] * y + m[8] * z + (w ? r : 0),
      ];
    };
  }

  private expandVertices(from: Vector3, to: Vector3, rotate: Rotation): Vector3[] {
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
      [t[0], t[1], t[2]],
    ];

    return original.map((v) => rotate([...v, 1]));
  }

  private getTangent(rotate: Rotation): Record<"u" | "v", Record<SixSides, Vector3>> {
    return {
      u: {
        east: rotate([0, 0, -1, 0]),
        west: rotate([0, 0, 1, 0]),
        up: rotate([1, 0, 0, 0]),
        down: rotate([1, 0, 0, 0]),
        south: rotate([1, 0, 0, 0]),
        north: rotate([-1, 0, 0, 0]),
      }, 
      v: {
        east: rotate([0, -1, 0, 0]),
        west: rotate([0, -1, 0, 0]),
        up: rotate([0, 0, 1, 0]),
        down: rotate([0, 0, -1, 0]),
        south: rotate([0, -1, 0, 0]),
        north: rotate([0, -1, 0, 0]),
      }
    };
  }

  private sixSides = {
    up: [
      [2, 3, 7, 6],
      [0, 1, 0],
    ],
    west: [
      [2, 0, 1, 3],
      [-1, 0, 0],
    ],
    east: [
      [7, 5, 4, 6],
      [1, 0, 0],
    ],
    south: [
      [3, 1, 5, 7],
      [0, 0, 1],
    ],
    north: [
      [6, 4, 0, 2],
      [0, 0, -1],
    ],
    down: [
      [1, 0, 4, 5],
      [0, -1, 0],
    ],
  } as const;
}

function deepCopy<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

type FullModel = Required<Omit<RawBlockModel, "parent" | "display">>;

type Rotation = (vec: Vector4) => Vector3;

/**
 * Refer to https://minecraft.wiki/w/Model
 */
interface RawBlockModel {
  parent?: string;
  ambientocclusion?: boolean;
  display?: never; // currently not used
  textures?: { [texture: string]: string };
  elements?: RawBlockModelElement[];
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
