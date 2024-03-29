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
  texture: BlockModelPath;
  cullface: SixSides;
  tintindex: number;
}

export enum BlockModelPath {
  Air = "air",

  // cubes
  Block          = "block",
  Cube           = "cube", 
  CubeAll        = "cube_all", 
  CubeColumn     = "cube_column", 

  Glass          = "glass", 
  IronBlock      = "iron_block", 
  RedstoneLamp   = "redstone_lamp", 
  RedstoneLampOn = "redstone_lamp_on", 
  Target         = "target", 

  // torches
  TemplateTorchWall    = "template_torch_wall", 
  TemplateTorch        = "template_torch",

  RedstoneTorchOff     = "redstone_torch_off", 
  RedstoneTorch        = "redstone_torch", 
  RedstoneWallTorchOff = "redstone_wall_torch_off", 
  RedstoneWallTorch    = "redstone_wall_torch", 

  // comparator
  ComparatorOnSubtract = "comparator_on_subtract", 
  ComparatorOn         = "comparator_on", 
  ComparatorSubtract   = "comparator_subtract", 
  Comparator           = "comparator", 

  // lever
  LeverOn = "lever_on", 
  Lever   = "lever", 

  // redstone dust
  RedstoneDustDot      = "redstone_dust_dot", 
  RedstoneDustSideAlt  = "redstone_dust_side_alt", 
  RedstoneDustSideAlt0 = "redstone_dust_side_alt0", 
  RedstoneDustSideAlt1 = "redstone_dust_side_alt1", 
  RedstoneDustSide     = "redstone_dust_side", 
  RedstoneDustSide0    = "redstone_dust_side0", 
  RedstoneDustSide1    = "redstone_dust_side1", 
  RedstoneDustUp       = "redstone_dust_up", 

  // repeater
  Repeater1tickLocked   = "repeater_1tick_locked", 
  Repeater1tickOnLocked = "repeater_1tick_on_locked", 
  Repeater1tickOn       = "repeater_1tick_on", 
  Repeater1tick         = "repeater_1tick", 
  Repeater2tickLocked   = "repeater_2tick_locked", 
  Repeater2tickOnLocked = "repeater_2tick_on_locked", 
  Repeater2tickOn       = "repeater_2tick_on", 
  Repeater2tick         = "repeater_2tick", 
  Repeater3tickLocked   = "repeater_3tick_locked", 
  Repeater3tickOnLocked = "repeater_3tick_on_locked", 
  Repeater3tickOn       = "repeater_3tick_on", 
  Repeater3tick         = "repeater_3tick", 
  Repeater4tickLocked   = "repeater_4tick_locked", 
  Repeater4tickOnLocked = "repeater_4tick_on_locked", 
  Repeater4tickOn       = "repeater_4tick_on", 
  Repeater4tick         = "repeater_4tick", 
}
