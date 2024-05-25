import { NewBlock, Maps } from "../utils";
import type {
  BlockData,
  BlockInternal,
  BlockOptions,
  BlockSpawnOptions,
  BlockState,
  Blocks,
  PowerTransmission,
  SixSides,
} from "../types";
import type { BlockType } from "../types";
import type Engine from "../Engine";

/**
 * 代表一個方塊
 */
abstract class Block {
  public engine: Engine;
  public x: number;
  public y: number;
  public z: number;

  public topSolid: boolean;
  public sideSolid: boolean;
  public bottomSolid: boolean;
  public attachedFace: SixSides | null;

  public breakable: boolean;
  public transparent: boolean;
  public redirectRedstone: "full" | "line" | "none";
  public internal: BlockInternal;

  public abstract type: BlockType;
  public abstract states: BlockState;

  constructor(options: BlockOptions) {
    this.engine = options.engine;
    this.x = options.x;
    this.y = options.y;
    this.z = options.z;

    this.topSolid = options.solid || options.topSolid || false;
    this.sideSolid = options.solid || options.sideSolid || false;
    this.bottomSolid = options.solid || options.bottomSolid || false;
    this.attachedFace = null;

    this.breakable = options.breakable || true;
    this.transparent = options.transparent || false;
    this.redirectRedstone = options.redirectRedstone ?? "none";
    this.internal = { power: 0, source: false };
  }

  /**
   * 用給定的方塊資料生出方塊
   */
  static spawn({ x, y, z, type, states, internal, breakable, engine }: BlockSpawnOptions): Blocks {
    const block = NewBlock(type, { x, y, z, engine }, states);
    block.breakable = breakable || false;
    block.states = states as any;
    block.internal = internal;
    return block;
  }

  /**
   * 把一個方塊轉換成可儲存的資料形式
   */
  static extract(block: Blocks): BlockData {
    return {
      type: block.type,
      breakable: block.breakable,
      states: structuredClone(block.states),
      internal: structuredClone(block.internal),
    };
  }

  get power() {
    return this.internal.power;
  }

  get supportingBlock(): Blocks | null {
    return null;
  }

  support(face: SixSides): boolean {
    if (face === "up") return this.topSolid;
    if (face === "down") return this.bottomSolid;
    return this.sideSolid;
  }

  /**
   * 取得此方塊對指定方向導線元件外的方塊的能量輸出情形，只能被導線元件（紅石粉、紅石中繼器、紅石比較器）以外的方塊呼叫
   */
  powerTowardsBlock(_: SixSides): PowerTransmission {
    return { strong: false, power: 0 };
  }

  /**
   * 取得此方塊對指定方向導線元件的能量輸出情形，只能被導線元件（紅石粉、紅石中繼器、紅石比較器）呼叫
   */
  powerTowardsWire(_: SixSides): PowerTransmission {
    return { strong: this.internal.source, power: this.internal.power };
  }

  /**
   * 發送 Post Placement Update 到相鄰的方塊
   */
  sendPPUpdate() {
    this.engine.needRender = true;

    this.PPUpdate();
    Maps.P6DArray.forEach(([, [x, y, z]]) => {
      this.engine.block(this.x + x, this.y + y, this.z + z)?.PPUpdate();
    });
  }

  /**
   * 根據 Post Placement Update 的來源方向更新自身狀態
   */
  PPUpdate() {
    if (this.attachedFace && !this.supportingBlock?.support(this.attachedFace)) {
      this.engine._leftClick(this.x, this.y, this.z);
      return;
    }
  }
}

export default Block;
