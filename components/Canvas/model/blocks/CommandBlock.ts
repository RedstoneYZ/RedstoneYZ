import FullBlock from "./FullBlock";
import type { BlockOptions, SixSides } from "../types";
import { BlockType } from "../types";

class CommandBlock extends FullBlock {
  public type: BlockType.CommandBlock;
  public states: CommandBlockState;

  constructor(options: BlockOptions) {
    super(options);

    this.type = BlockType.CommandBlock;
    this.states = { conditional: false, facing: "down" };
  }
}

type CommandBlockState = {
  conditional: boolean;
  facing: SixSides;
};

export default CommandBlock;
