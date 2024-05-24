import type { BlockOptions } from "../types";
import { Maps } from "../utils";
import Block from "./Block";

abstract class FullBlock extends Block {
  constructor(options: BlockOptions) {
    super({ solid: true, ...options });
  }

  override PPUpdate() {
    super.PPUpdate();

    const oldPower = this.internal.power;
    const oldSource = this.internal.source;

    let newPower = 0;
    let newSource = false;
    Maps.P6DArray.forEach(([dir, [x, y, z]]) => {
      const block = this.engine.block(this.x + x, this.y + y, this.z + z);
      const powerStatus = block?.powerTowardsBlock(Maps.ReverseDir[dir]);
      if (powerStatus) {
        newPower = Math.max(newPower, powerStatus.power);
        newSource ||= powerStatus.strong;
      }
    });

    this.internal.power = newPower;
    this.internal.source = newSource;

    if (oldPower !== this.internal.power || oldSource !== this.internal.source) {
      this.sendPPUpdate();
    }
  }
}

export default FullBlock;
