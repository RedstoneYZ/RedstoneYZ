import Engine from "./Engine";
import { AirBlock, GlassBlock, IronBlock, Lever, RedstoneComparator, RedstoneDust, RedstoneLamp, RedstoneRepeater, RedstoneTorch, RedstoneWallTorch, Target } from "./core";

export type CanvasProps = {
  canvasWidth: number;
  canvasHeight: number;
  storable?: boolean;
  checkable?: boolean;
} & ({
  xLen: number;
  yLen: number;
  zLen: number;
} | {
  preLoadData: MapData;
})

export interface ControllerOptions {
  xLen: number;
  yLen: number;
  zLen: number;
  mapName: string;
  preLoadData?: MapData;
}

export interface EngineOptions {
  xLen: number;
  yLen: number;
  zLen: number;
  mapName: string;
  validation?: ValidationData;
}

export type EngineTaskParams = {
  leftClick: [number, number, number], 
  rightClick: [number, number, number, boolean, Vector3, FourFacings, BlockType], 
  torchUpdate: [number, number, number, boolean], 
  repeaterUpdate: [number, number, number, boolean], 
  comparatorUpdate: [number, number, number, number], 
  lampUnlit: [number, number, number]
}

export type EngineTask = { [K in keyof EngineTaskParams]: [K, EngineTaskParams[K], number] }[keyof EngineTaskParams]


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
  AirBlock = 0, 
  IronBlock = 1, 
  GlassBlock = 2, 
  RedstoneDust = 100, 
  RedstoneTorch = 101, 
  RedstoneRepeater = 102,
  RedstoneLamp = 103, 
  Lever = 104,
  RedstoneComparator = 105, 
  Target = 106
}


export type Blocks = AirBlock | GlassBlock | IronBlock | Lever | RedstoneComparator | RedstoneDust | RedstoneLamp | RedstoneRepeater | RedstoneTorch | RedstoneWallTorch | Target;

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
  fullBlock?: boolean;
  fullSupport?: boolean;
  upperSupport?: boolean;
  bottomSupport?: boolean;
  sideSupport?: boolean;
  needSupport?: boolean;
  needBottomSupport?: boolean;

  redstoneAutoConnect?: "full" | "line" | "none";
}

export interface BlockSpawnOptions {
  x: number;
  y: number;
  z: number;
  type: BlockType;
  states: BlockStates;
  engine: Engine;
  breakable?: boolean;
}

export interface BlockData {
  type: BlockType;
  breakable: boolean;
  states: BlockStates;
}

export interface PowerTransmission {
  strong: boolean;
  power: number;
}

export interface BlockStates {
  power: number;
  source: boolean;
}

export interface LeverStates extends BlockStates {
  /** 控制桿的附著位置 */
  face: ThreeFaces;

  /** 控制桿的面向方向 */
  facing: FourFacings;

  /** 控制桿是否被拉下 */
  powered: boolean;
}

export interface RedstoneDustStates extends BlockStates {
  /** 紅石粉東側的連接狀態，0 為無，1 為有，2 為有且向上 */
  east: 0 | 1 | 2;

  /** 紅石粉西側的連接狀態，0 為無，1 為有，2 為有且向上 */
  west: 0 | 1 | 2;

  /** 紅石粉北側的連接狀態，0 為無，1 為有，2 為有且向上 */
  north: 0 | 1 | 2;

  /** 紅石粉南側的連接狀態，0 為無，1 為有，2 為有且向上 */
  south: 0 | 1 | 2;
}

export interface RedstoneTorchBaseStates extends BlockStates {
  /** 紅石火把是否被觸發 */
  lit: boolean;
}

export interface RedstoneTorchStates extends RedstoneTorchBaseStates {}

export interface RedstoneWallTorchStates extends RedstoneTorchBaseStates {
  /** 紅石火把面向的方向 */
  facing: FourFacings;
}

export interface RedstoneRepeaterStates extends BlockStates {
  /** 紅石中繼器的延遲 */
  delay: number;

  /** 紅石中繼器的指向 */
  facing: FourFacings;

  /** 紅石中繼器是否被鎖定 */
  locked: boolean;

  /** 紅石中繼器是否被激發 */
  powered: boolean;
}

export interface RedstoneComparatorStates extends BlockStates {
  /** 紅石比較器的面向方向 */
  facing: FourFacings;

  /** 紅石比較器的運行模式 */
  mode: "compare" | "subtract";

  /** 紅石比較器是否被啟動 */
  powered: boolean;
}

export interface RedstoneLampStates extends BlockStates {
  /** 紅石燈是否被觸發 */
  lit: boolean;
}

export interface RedstoneTargetStates extends BlockStates {
  /** 標靶散發的訊號等級 */
  power: number;
}


export type WebGLTextureData = Record<SixSides, { source: string, vertices: number[] }>;

export interface WebGLData {
  textures: WebGLTextureData[];
  outlines: number[];
}

export type Vector2 = [number, number];
export type Vector3 = [number, number, number];
export type Vector4 = [number, number, number, number];
export type Vector6 = [number, number, number, number, number, number];

export type SixSides = "east" | "west" | "up" | "down" | "south" | "north";
export type FourFacings = "east" | "west" | "south" | "north";
export type ThreeFaces = "ceiling" | "wall" | "floor";
export type ThreeAxes = "x" | "y" | "z";