import { Maps } from "../utils";
import FullBlock from "./FullBlock";
import { BlockOptions, BlockType, RedstoneLampStates } from "../types";
import { BlockModelPath } from "../../view/types";

class RedstoneLamp extends FullBlock {
  public type: BlockType.RedstoneLamp;
  public model: BlockModelPath.RedstoneLamp;
  public states: RedstoneLampStates;

  constructor(options: BlockOptions) {
    super(options);

    this.type = BlockType.RedstoneLamp;
    this.model = BlockModelPath.RedstoneLamp;
    this.states = { power: 0, source: false, lit: false };
  }

  override PPUpdate() {
    super.PPUpdate();

    if (this._shouldLit()) {
      this.states.lit = true;
    }
    else {
      this.engine.addTask(['lampUnlit', [this.x, this.y, this.z], 4]);
    }
  }

  lampUnlit() {
    if (this._shouldLit()) return;

    this.states.lit = false;
  }


  /**
   * 判斷此紅石燈是否應該要被點亮
   */
  private _shouldLit() {
    if (this.power) return true;

    const litByPower = Maps.P6DArray.some(([_, [x, y, z]]) => {
      const block = this.engine.block(this.x + x, this.y + y, this.z + z);
      return block?.states.power;
    });
    return litByPower;
  }
}

export default RedstoneLamp;