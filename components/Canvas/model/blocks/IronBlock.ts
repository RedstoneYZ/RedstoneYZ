import FullBlock from "./FullBlock";
import { BlockOptions, BlockStates, BlockType } from "../types";

class IronBlock extends FullBlock {
  public type: BlockType.IronBlock;
  public states: BlockStates;

  constructor(options: BlockOptions) {
    super(options);

    this.type = BlockType.IronBlock;
    this.states = { power: 0, source: false };
  }
}

export default IronBlock;