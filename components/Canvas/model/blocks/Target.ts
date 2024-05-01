import FullBlock from "./FullBlock";
import { BlockOptions, BlockType } from "../types";

class Target extends FullBlock {
  public type: BlockType.Target;
  public states: RedstoneTargetState;

  constructor(options: BlockOptions) {
    super({ redirectRedstone: 'full', ...options });

    this.type = BlockType.Target;
    this.states = { power: 0 };
  }
}

type RedstoneTargetState = {
  /** 標靶散發的訊號等級 */
  power: number;
};

export default Target;