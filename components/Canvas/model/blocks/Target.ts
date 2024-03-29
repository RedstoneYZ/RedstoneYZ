import FullBlock from "./FullBlock";
import { BlockOptions, BlockStates, BlockType } from "../types";
import { BlockModelPath } from "../../view/types";

class Target extends FullBlock {
  public type: BlockType.Target;
  public model: BlockModelPath.Target;
  public states: BlockStates;

  constructor(options: BlockOptions) {
    super({ redstoneAutoConnect: 'full', ...options });

    this.type = BlockType.Target;
    this.model = BlockModelPath.Target;
    this.states = { power: 0, source: false };
  }
}

export default Target;