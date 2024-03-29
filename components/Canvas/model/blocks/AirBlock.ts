import { BlockOptions, BlockStates, BlockType } from "../types";
import { BlockModelPath } from "../../view/types";
import Block from "./Block";

class AirBlock extends Block {
  public type: BlockType.AirBlock;
  public model: BlockModelPath.Air;
  public states: BlockStates;

  constructor(options: BlockOptions) {
    super({ transparent: true, ...options });

    this.type = BlockType.AirBlock;
    this.model = BlockModelPath.Air;
    this.states = { power: 0, source: false };
  }

  override PPUpdate() {}
}

export default AirBlock;