import { BlockOptions, BlockStates, BlockType } from "../types";
import Block from "./Block";

class AirBlock extends Block {
  public type: BlockType.AirBlock;
  public states: BlockStates;

  constructor(options: BlockOptions) {
    super({ transparent: true, ...options });

    this.type = BlockType.AirBlock;
    this.states = { power: 0, source: false };
  }

  override PPUpdate() {}
}

export default AirBlock;