import type { BlockOptions, BlockType, SixSides } from "../types";
import Block from "./Block";

abstract class RedstoneTorchBase extends Block {
  public type: BlockType.RedstoneTorch | BlockType.RedstoneWallTorch;
  public states: RedstoneTorchBaseState;

  constructor(options: BlockOptions) {
    super({ redirectRedstone: "full", ...options });

    this.states = { lit: true };
    this.internal = { power: 0, source: true };
  }

  override get power() {
    return this.states.lit ? 15 : 0;
  }

  override powerTowardsBlock(direction: SixSides): { strong: boolean; power: number } {
    return direction === "up" && this.states.lit
      ? { strong: true, power: 15 }
      : { strong: false, power: 0 };
  }

  override powerTowardsWire(): { strong: boolean; power: number } {
    return { strong: this.states.lit, power: this.states.lit ? 15 : 0 };
  }

  /**
   * 根據 Post Placement Update 的來源方向更新自身狀態
   */
  override PPUpdate() {
    super.PPUpdate();

    const attachedBlock = this.supportingBlock;
    if (!attachedBlock?.internal.power !== this.states.lit) {
      this.engine.addTask([
        "torchUpdate",
        [this.x, this.y, this.z, !attachedBlock?.internal.power],
        2,
      ]);
    }
  }

  /**
   * 更新此紅石火把的明暗狀態
   */
  torchUpdate(lit: boolean) {
    this.states.lit = lit;
    this.internal.source = lit;
    this.sendPPUpdate();
  }
}

type RedstoneTorchBaseState = {
  /** 紅石火把是否被觸發 */
  lit: boolean;
};

export default RedstoneTorchBase;
