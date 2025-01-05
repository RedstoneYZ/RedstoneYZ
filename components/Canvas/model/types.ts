import type Engine from "./Engine";
import type {
  AirBlock,
  CommandBlock,
  Glass,
  IronBlock,
  Lever,
  RedstoneComparator,
  RedstoneDust,
  RedstoneLamp,
  RedstoneRepeater,
  RedstoneTorch,
  RedstoneWallTorch,
  Target,
} from "./blocks";

export type CanvasProps = {
  canvasWidth: number;
  canvasHeight: number;
  storable?: boolean;
  checkable?: boolean;
} & (
  | {
      xLen: number;
      yLen: number;
      zLen: number;
    }
  | {
      preLoadData: MapData;
    }
);

export interface EngineOptions {
  xLen: number;
  yLen: number;
  zLen: number;
  mapName: string;
  validation?: ValidationData | undefined;
}

export interface Gamerule {
  doDaylightCycle: boolean;
}

export type EngineTaskParams = {
  leftClick: [number, number, number];
  rightClick: [number, number, number, boolean, Vector3, FourFacings, BlockType];
  torchUpdate: [number, number, number, boolean];
  repeaterUpdate: [number, number, number, boolean];
  comparatorUpdate: [number, number, number, number];
  lampUnlit: [number, number, number];
};

export type EngineTask = {
  [K in keyof EngineTaskParams]: [K, EngineTaskParams[K], number];
}[keyof EngineTaskParams];

export interface MapData {
  xLen: number;
  yLen: number;
  zLen: number;
  mapName: string;
  blocks: (BlockData | null)[][][];
  validation?: ValidationData;
  availableBlocks?: BlockType[];
}

export interface ValidationData {
  /** 所有控制桿的位置 */
  leverLocations: Vector3[];

  /** 所有紅石燈的位置 */
  lampLocations: Vector3[];

  /** 每個紅石燈對應的，以 SOP 的形式表示的布林函數 */
  boolFuncs: number[][][];

  /** 以 SOP 每次對控制桿操作後要等待多久才判斷輸出的正確性 */
  timeout: number;
}

export enum BlockType {
  AirBlock = "air",
  CommandBlock = "command_block",
  IronBlock = "iron_block",
  Glass = "glass",
  RedstoneDust = "redstone_wire",
  RedstoneTorch = "redstone_torch",
  RedstoneWallTorch = "redstone_wall_torch",
  RedstoneRepeater = "repeater",
  RedstoneLamp = "redstone_lamp",
  Lever = "lever",
  RedstoneComparator = "comparator",
  Target = "target",
}

export type Blocks =
  | AirBlock
  | CommandBlock
  | Glass
  | IronBlock
  | Lever
  | RedstoneComparator
  | RedstoneDust
  | RedstoneLamp
  | RedstoneRepeater
  | RedstoneTorch
  | RedstoneWallTorch
  | Target;

export type BlockConstructor = new (options: BlockOptions) => Blocks;

export interface BlockOptions {
  x: number;
  y: number;
  z: number;

  engine: Engine;

  /** 放置方塊時依據的面的指向 */
  normDir?: SixSides;

  /** 與觀察視角最接近的軸向量方向 */
  facingDir?: FourFacings;

  breakable?: boolean;

  transparent?: boolean;
  solid?: boolean;
  topSolid?: boolean;
  bottomSolid?: boolean;
  sideSolid?: boolean;

  redirectRedstone?: "full" | "line" | "none";
}

export type BlockState = Record<string, unknown>;

export interface BlockSpawnOptions {
  x: number;
  y: number;
  z: number;
  type: BlockType;
  states: BlockState;
  internal: BlockInternal;
  engine: Engine;
  breakable?: boolean;
}

export interface BlockData {
  type: BlockType;
  breakable: boolean;
  states: BlockState;
  internal: BlockInternal;
}

export interface PowerTransmission {
  strong: boolean;
  power: number;
}

export interface BlockInternal {
  power: number;
  source: boolean;
}

export interface ParticleOption {
  engine: Engine;
  x: number;
  y: number;
  z: number;

  type: BlockType;
}

export interface ParticleData {
  x: number;
  y: number;
  z: number;

  textureX1: number;
  textureY1: number;
  textureX2: number;
  textureY2: number;

  type: BlockType;
  randomSize: number;
}

export type Vector2 = [number, number];
export type Vector3 = [number, number, number];
export type Vector4 = [number, number, number, number];
export type Vector6 = [number, number, number, number, number, number];
export type Vector9 = [number, number, number, number, number, number, number, number, number];

export type SixSides = "east" | "west" | "up" | "down" | "south" | "north";
export type FourFacings = "east" | "west" | "south" | "north";
export type ThreeFaces = "ceiling" | "wall" | "floor";
export type ThreeAxes = "x" | "y" | "z";
