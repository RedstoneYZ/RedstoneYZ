import { BlockOptions, BlockType, RedstoneTorchStates } from "../types";
import RedstoneTorchBase from "./RedstoneTorchBase";

class RedstoneTorch extends RedstoneTorchBase {
  public override states: RedstoneTorchStates;

  constructor(options: BlockOptions) {
    super({ needSupport: true, transparent: true, redstoneAutoConnect: 'full', ...options });

    this.type = BlockType.RedstoneTorch;
    this.states = { power: 0, source: true, lit: true };
  }

  override get supportingBlock() {
    return this.engine.block(this.x, this.y - 1, this.z);
  }
}

export default RedstoneTorch;
