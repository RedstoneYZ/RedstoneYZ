import { redstone_torch_off, redstone_torch } from "@/public/json/blocks";
import { BlockOptions, RedstoneTorchStates, WebGLData } from "../../types";
import RedstoneTorchBase from "./RedstoneTorchBase";

class RedstoneTorch extends RedstoneTorchBase {
  public states: RedstoneTorchStates;

  constructor(options: BlockOptions) {
    super({ needSupport: true, transparent: true, redstoneAutoConnect: 'full', ...options });

    this.states = { power: 0, source: true, lit: true };
  }

  get power() {
    return this.states.lit ? 15 : 0;
  }

  get supportingBlock() {
    return this.engine.block(this.x, this.y - 1, this.z);
  }

  get textures() {
    return _model[+this.states.lit].textures;
  }

  get outlines() {
    return _model[+this.states.lit].outlines;
  }
}

export default RedstoneTorch;

const _model: [WebGLData, WebGLData] = [redstone_torch_off, redstone_torch];