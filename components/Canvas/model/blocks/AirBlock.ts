import type { BlockOptions } from "../types";
import { BlockType } from "../types";
import Block from "./Block";

class AirBlock extends Block {
  public type: BlockType.AirBlock;
  public states: AirBlockState;

  constructor(options: BlockOptions) {
    super({ transparent: true, ...options });

    this.type = BlockType.AirBlock;
    this.states = {};
  }

  override PPUpdate() {}
}

type AirBlockState = Record<string, never>;

export default AirBlock;
