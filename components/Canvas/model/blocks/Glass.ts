import FullBlock from "./FullBlock";
import { BlockOptions, BlockType } from "../types";

class Glass extends FullBlock {
  public type: BlockType.Glass;
  public states: GlassState;

  constructor(options: BlockOptions) {
    super({ transparent: true, ...options });

    this.type = BlockType.Glass;
    this.states = {};
  }

  override PPUpdate() {}
}

type GlassState = Record<string, never>;

export default Glass;