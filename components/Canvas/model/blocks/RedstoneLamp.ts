import { Maps } from "../utils";
import FullBlock from "./FullBlock";
import type { BlockOptions } from "../types";
import { BlockType } from "../types";

class RedstoneLamp extends FullBlock {
  public type: BlockType.RedstoneLamp;
  public states: RedstoneLampState;

  constructor(options: BlockOptions) {
    super(options);

    this.type = BlockType.RedstoneLamp;
    this.states = { lit: false };
  }

  override PPUpdate() {
    super.PPUpdate();

    if (this.shouldLit()) {
      this.states.lit = true;
    } else {
      this.engine.addTask(["lampUnlit", [this.x, this.y, this.z], 4]);
    }
  }

  lampUnlit() {
    if (this.shouldLit()) return;
    this.states.lit = false;
  }

  /**
   * 判斷此紅石燈是否應該要被點亮
   */
  private shouldLit() {
    if (this.power) return true;

    const litByPower = Maps.P6DArray.some(([, [x, y, z]]) => {
      const block = this.engine.block(this.x + x, this.y + y, this.z + z);
      return block?.power;
    });
    return litByPower;
  }
}

type RedstoneLampState = {
  /** 紅石燈是否被觸發 */
  lit: boolean;
};

export default RedstoneLamp;
