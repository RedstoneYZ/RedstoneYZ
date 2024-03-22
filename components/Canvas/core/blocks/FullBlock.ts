import { BlockOptions } from "../../typings/types";
import { Maps } from "../utils";
import Block from "./Block";

/**
 * 代表一個單位方塊
 */
abstract class FullBlock extends Block {
  constructor(options: BlockOptions) {
    super({ fullBlock: true, fullSupport: true, ...options });
  }

  /**
   * 更新自身狀態
   */
  PPUpdate() {
    super.PPUpdate();

    const oldPower = this.states.power;
    const oldSource = this.states.source;

    let power = 0, source = false;
    Maps.P6DArray.forEach(([dir, [x, y, z]]) => {
      const block = this.engine.block(this.x + x, this.y + y, this.z + z);
      const powerStatus = block?.powerTowardsBlock(Maps.ReverseDir[dir]);
      if (powerStatus) {
        power = Math.max(power, powerStatus.power);
        source ||= powerStatus.strong;
      }
    });

    this.states.power = power;
    this.states.source = source;

    if (oldPower !== this.states.power || oldSource !== this.states.source) {
      this.sendPPUpdate();
    }
  }
}

export default FullBlock;