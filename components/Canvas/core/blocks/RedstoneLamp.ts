import { Maps } from "../utils";
import FullBlock from "./FullBlock";
import { redstone_lamp, redstone_lamp_on } from "@/public/json/blocks";
import { BlockOptions, BlockType, RedstoneLampStates, WebGLData } from "../../types";


/**
 * 代表一個紅石燈
 */
class RedstoneLamp extends FullBlock {
  public type: BlockType.RedstoneLamp;
  public states: RedstoneLampStates;

  constructor(options: BlockOptions) {
    super(options);

    this.type = BlockType.RedstoneLamp;
    this.states = { power: 0, source: false, lit: false };
  }

  get textures() {
    return _model[+this.states.lit].textures;
  }

  get outlines() {
    return _model[+this.states.lit].outlines;
  }

  PPUpdate() {
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
    if (litByPower) return true;
  }
}

export default RedstoneLamp;

const _model: [WebGLData, WebGLData] = [redstone_lamp, redstone_lamp_on];