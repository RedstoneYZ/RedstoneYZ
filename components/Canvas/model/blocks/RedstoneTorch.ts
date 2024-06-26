import type { BlockOptions } from "../types";
import { BlockType } from "../types";
import RedstoneTorchBase from "./RedstoneTorchBase";

class RedstoneTorch extends RedstoneTorchBase {
  public override states: RedstoneTorchState;

  constructor(options: BlockOptions) {
    super(options);

    this.type = BlockType.RedstoneTorch;
    this.states = { lit: true };
    this.attachedFace = "up";
  }

  override get supportingBlock() {
    return this.engine.block(this.x, this.y - 1, this.z);
  }
}

type RedstoneTorchState = {
  /** 紅石火把是否被觸發 */
  lit: boolean;
};

export default RedstoneTorch;
