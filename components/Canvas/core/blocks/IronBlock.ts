import FullBlock from "./FullBlock";
import { iron_block } from "@/public/json/blocks";
import { BlockOptions, BlockStates, BlockType, WebGLTextureData } from "../../typings/types";

/**
 * 代表一個鐵方塊，即不透明的單位方塊
 */
class IronBlock extends FullBlock {
  public type: BlockType.IronBlock;
  public states: BlockStates;

  public textures: WebGLTextureData[];
  public outlines: number[];

  constructor(options: BlockOptions) {
    super(options);

    this.type = BlockType.IronBlock;
    this.states = { power: 0, source: false };

    this.textures = iron_block.textures;
    this.outlines = iron_block.outlines;
  }
}

export default IronBlock;