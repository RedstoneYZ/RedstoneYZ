import { NewBlock, Maps } from "../utils";
import { BlockData, BlockInternal, BlockOptions, BlockSpawnOptions, BlockType, Blocks, PowerTransmission, SixSides } from "../types";
import Engine from "../Engine";

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
  public needSupport: boolean;
  public needBottomSupport: boolean;
  
  public breakable: boolean;
  public transparent: boolean;
  public redirectRedstone: "full" | "line" | "none";
  public internal: BlockInternal;

  public abstract type: BlockType;
  public abstract states: Record<string, unknown>;

  constructor(options: BlockOptions) {
    this.engine = options.engine;
    this.x = options.x;
    this.y = options.y;
    this.z = options.z;

    this.topSolid = options.solid || options.topSolid || false;
    this.sideSolid = options.solid || options.sideSolid || false;
    this.bottomSolid = options.solid || options.bottomSolid || false;
    this.needSupport = options.needSupport || false;
    this.needBottomSupport = options.needBottomSupport || false;
    
    this.breakable = options.breakable || true;
    this.transparent = options.transparent || false;
    this.redirectRedstone = options.redirectRedstone ?? 'none';
    this.internal = { power: 0, source: false };
  }

  /**
   * 用給定的方塊資料生出方塊
   */
  static spawn({ x, y, z, type, states, breakable, engine }: BlockSpawnOptions): Blocks {
    const block = NewBlock(type, { x, y, z, engine }, states);
    block.breakable = breakable || false;
    block.states = states as any;
    return block;
  }

  /**
   * 把一個方塊轉換成可儲存的資料形式
   */
  static extract(block: Blocks): BlockData {
    const states = JSON.parse(JSON.stringify(block.states));
    delete states.__typename;
    return {
      type: block.type, 
      breakable: block.breakable, 
      states: states
    };
  }

  /**
   * 取得此方塊的充能強度
   */
  get power() {
    return this.states.power;
  }

  /**
   * 取得此方塊的附著方塊，`undefined` 代表此方塊不需要附著方塊
   */
  get supportingBlock(): Blocks | null | undefined {
    return undefined;
  }

  /**
   * 取得此方塊對指定方向導線元件外的方塊的能量輸出情形，只能被導線元件（紅石粉、紅石中繼器、紅石比較器）以外的方塊呼叫
   */
  powerTowardsBlock(_direction: SixSides): PowerTransmission {
    return { strong: false, power: 0 };
  }

  /**
   * 取得此方塊對指定方向導線元件的能量輸出情形，只能被導線元件（紅石粉、紅石中繼器、紅石比較器）呼叫
   */
  powerTowardsWire(_direction: SixSides): PowerTransmission {
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
    if (this.supportingBlock === null || this.supportingBlock?.type === BlockType.AirBlock) {
      this.engine._leftClick(this.x, this.y, this.z);
      return;
    }
  }
}

export default Block;