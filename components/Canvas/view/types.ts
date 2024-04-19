import { SixSides, Vector2, Vector3 } from "../model/types";

export interface BlockModel {
  ambientocclusion: boolean;
  faces: BlockModelFace[];
  outlines: Vector3[][];
}

export interface BlockModelFace {
  corners: [Vector3, Vector3, Vector3, Vector3];
  texCords: [Vector2, Vector2, Vector2, Vector2];
  normal: Vector3;
  shade: boolean;
  texture: string;
  cullface: SixSides;
  tintindex: number;
}

export interface BlockModelRule {
  model: string;
  x: number;
  y: number;
  uvlock: boolean;
  weight: number;
}