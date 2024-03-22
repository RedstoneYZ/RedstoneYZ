import Engine from "../Engine";
import { AirBlock, GlassBlock, IronBlock, Lever, RedstoneComparator, RedstoneDust, RedstoneLamp, RedstoneRepeater, RedstoneTorch, RedstoneWallTorch, Target } from "../core";

export type VauleOf<T> = T[keyof T];

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


export interface PlaygroundOptions {
  xLen: number;
  yLen: number;
  zLen: number;
  mapName: string;
  preLoadData?: MapData;
}

export interface PlaygroundAngles {
  theta: number;
  phi: number;
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
  playground: (BlockData | null)[][][];
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


export interface RawBlockData {
  /** 此方塊需參考的母模型的名稱 */
  parent?: string;

  /** 此方塊的材質列表 */
  textures?: { [name: string]: string };

  /** 所有模型箱的資訊 */
  elements?: RawBlockElementData[];

  /** 所有特殊互動箱的資訊 */
  outlines?: RawBlockOutlineData[];

  /** 此方塊是否能夠三面附著 */
  face?: boolean;

  /** 此方塊是否為四向方塊 */
  facing?: boolean;

  /** 預設要先沿 y 軸旋轉 90 度的次數 */
  prerotation?: number;
}

/** 被展開後的方塊資料 */
export type FullBlockData =
  Omit<RawBlockData, "parent" | "textures"> & 
  { elements: RawBlockElementData[], textures: { [name: string]: string } };

/** 方塊的模型箱資料 */
export interface RawBlockElementData {
  /** 模型箱的西/下/北側座標 */
  from: number[];

  /** 模型箱的東/上/南側座標 */
  to: number[];

  /** 實際繪出前需要的旋轉 */
  rotation?: RawRotationData;

  /** 每個面的材質 */
  faces: Partial<Record<SixSides, RawFaceData>>;
}

/** 方塊的互動箱資料 */
export interface RawBlockOutlineData {
  /** 互動箱的西/下/北側座標 */
  from: number[];

  /** 互動箱的東/上/南側座標 */
  to: number[];
}

/** 用來描述沿著座標軸方向的旋轉 */
export interface RawRotationData {
  /** 旋轉的中心點 */
  origin: number[];

  /** 旋轉座標軸 */
  axis: string;

  /** 逆時針旋轉角度 */
  angle: number;
}

/** 用來描述一個長方形面的材質 */
export interface RawFaceData {
  /** 指定材質上的左/上/右/下側座標 */
  uv?: number[];

  /** 要套用的材質 */
  texture: string;

  /** 在套用材質前要先將其順時針旋轉的角度 */
  rotation?: number;
}

/** 方塊中所有的繪圖必要元件 */
export interface Components {
  /** 處理後的所有模型箱的資訊 */
  elements: ComponentsElement[];

  /** 處理後的所有特殊互動箱的資訊 */
  outlines: Vector3[][];

  /** 此方塊是否能夠三面附著 */
  face: boolean;

  /** 此方塊是否為四向方塊 */
  facing: boolean;

  /** 預設要先沿 y 軸旋轉 90 度的次數 */
  prerotation: number;
}

/** 模型箱的資訊 */
export interface ComponentsElement {
  /** 此模型箱八個頂點的資訊 */
  vertices: Vector3[];

  /** 旋轉後的三軸單位向量 */
  normals: Record<SixSides, Vector3>;

  /** 每個面的材質 */
  faces: Partial<Record<SixSides, FaceData>>;
}

/** 用來描述一個長方形面的材質 */
export interface FaceData {
  /** 四個頂點對應在圖片上的像素座標 */
  texCoord: [Vector2, Vector2, Vector2, Vector2];

  /** 要套用的材質 */
  texture: string;
}

export type WebGLTextureData = Record<SixSides, { source: string, vertices: number[] }>;

export interface WebGLData {
  textures: WebGLTextureData[];
  outlines: number[];
}

export type Rotation = (vec: Vector4) => Vector3;

export type Vector2 = [number, number];
export type Vector3 = [number, number, number];
export type Vector4 = [number, number, number, number];
export type Vector6 = [number, number, number, number, number, number];

export type SixSides = "east" | "west" | "up" | "down" | "south" | "north";
export type FourFacings = "east" | "west" | "south" | "north";
export type ThreeFaces = "ceiling" | "wall" | "floor" | "north";
export type ThreeAxes = "x" | "y" | "z";