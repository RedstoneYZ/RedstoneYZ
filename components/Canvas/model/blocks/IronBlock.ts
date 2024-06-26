import FullBlock from "./FullBlock";
import type { BlockOptions } from "../types";
import { BlockType } from "../types";

class IronBlock extends FullBlock {
  public type: BlockType.IronBlock;
  public states: IronBlockState;

  constructor(options: BlockOptions) {
    super(options);

    this.type = BlockType.IronBlock;
    this.states = {};
  }
}

type IronBlockState = Record<string, never>;

export default IronBlock;
