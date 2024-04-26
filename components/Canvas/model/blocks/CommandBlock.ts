import FullBlock from "./FullBlock";
import { BlockOptions, BlockType, CommandBlockStates } from "../types";

class CommandBlock extends FullBlock {
  public type: BlockType.CommandBlock;
  public states: CommandBlockStates;

  constructor(options: BlockOptions) {
    super(options);

    this.type = BlockType.CommandBlock;
    this.states = { power: 0, source: false, conditional: false, facing: 'down' };
  }
}

export default CommandBlock;