import { BlockOptions, BlockType, RedstoneTorchBaseStates, SixSides } from "../../typings/types";
import Block from "./Block";

abstract class RedstoneTorchBase extends Block {
  public type: BlockType.RedstoneTorch;
  public states: RedstoneTorchBaseStates;

  constructor(options: BlockOptions) {
    super({ needSupport: true, transparent: true, redstoneAutoConnect: 'full', ...options });

    this.type = BlockType.RedstoneTorch;
    this.states = { power: 0, source: true, lit: true };
  }

  get power() {
    return this.states.lit ? 15 : 0;
  }

  powerTowardsBlock(direction: SixSides): { strong: boolean, power: number } {
    return direction === 'up' && this.states.lit ?
      { strong: true, power: 15 } :
      { strong: false, power: 0 };
  }

  powerTowardsWire(): { strong: boolean, power: number } {
    return { strong: this.states.lit, power: this.states.lit ? 15 : 0 };
  }

  /**
   * 根據 Post Placement Update 的來源方向更新自身狀態
   */
  PPUpdate() {
    super.PPUpdate();
    
    const attachedBlock = this.supportingBlock;
    if (!attachedBlock?.states.power !== this.states.lit) {
      this.engine.addTask(['torchUpdate', [this.x, this.y, this.z, !attachedBlock?.states.power], 2]);
    }
  }

  /**
   * 更新此紅石火把的明暗狀態
   */
  torchUpdate(lit: boolean) {
    this.states.lit = lit;
    this.states.source = lit;
    this.sendPPUpdate();
  }
}

export default RedstoneTorchBase;