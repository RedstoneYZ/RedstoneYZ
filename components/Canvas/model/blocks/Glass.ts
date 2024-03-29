import FullBlock from "./FullBlock";
import { BlockOptions, BlockStates, BlockType } from "../types";
import { BlockModelPath } from "../../view/types";

class Glass extends FullBlock {
  public type: BlockType.Glass;
  public model: BlockModelPath.Glass;
  public states: BlockStates;

  constructor(options: BlockOptions) {
    super({ transparent: true, ...options });

    this.type = BlockType.Glass;
    this.model = BlockModelPath.Glass;
    this.states = { power: 0, source: false };
  }

  override PPUpdate() {}
}

export default Glass;