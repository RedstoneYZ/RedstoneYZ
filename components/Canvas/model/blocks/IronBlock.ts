import FullBlock from "./FullBlock";
import { BlockOptions, BlockStates, BlockType } from "../types";
import { BlockModelPath } from "../../view/types";

class IronBlock extends FullBlock {
  public type: BlockType.IronBlock;
  public model: BlockModelPath.IronBlock;
  public states: BlockStates;

  constructor(options: BlockOptions) {
    super(options);

    this.type = BlockType.IronBlock;
    this.model = BlockModelPath.IronBlock;
    this.states = { power: 0, source: false };
  }
}

export default IronBlock;