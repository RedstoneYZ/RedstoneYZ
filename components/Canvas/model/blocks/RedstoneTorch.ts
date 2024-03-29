import { BlockOptions, RedstoneTorchStates } from "../types";
import RedstoneTorchBase from "./RedstoneTorchBase";
import { BlockModelPath } from "../../view/types";

class RedstoneTorch extends RedstoneTorchBase {
  public model: BlockModelPath.RedstoneTorch;
  public override states: RedstoneTorchStates;

  constructor(options: BlockOptions) {
    super({ needSupport: true, transparent: true, redstoneAutoConnect: 'full', ...options });

    this.model = BlockModelPath.RedstoneTorch;
    this.states = { power: 0, source: true, lit: true };
  }

  override get supportingBlock() {
    return this.engine.block(this.x, this.y - 1, this.z);
  }
}

export default RedstoneTorch;
