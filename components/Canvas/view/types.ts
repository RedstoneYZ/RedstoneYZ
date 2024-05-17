import type { SixSides, Vector2, Vector3 } from "../model/types";

export interface BlockModel {
  ambientocclusion: boolean;
  faces: BlockModelFace[];
  outline: BlockOutline[];
}

export interface BlockModelFace {
  corners: [Vector3, Vector3, Vector3, Vector3];
  texCoord: [Vector2, Vector2, Vector2, Vector2];
  tangent: [Vector3, Vector3];
  shade: boolean;
  texture: string;
  cullface: SixSides | undefined;
  tintindex: number;
}

export interface BlockOutline {
  from: Vector3;
  to: Vector3;
}

export interface BlockModelRule {
  model: string;
  x: number;
  y: number;
  uvlock: boolean;
  weight: number;
}
