import FullBlock from "./FullBlock";
import { glass } from "@/public/json/blocks";
import { BlockOptions, BlockStates, BlockType, WebGLTextureData } from "../../typings/types";

/**
 * 代表一個玻璃方塊，即透明的單位方塊
 */
class GlassBlock extends FullBlock {
  public type: BlockType.GlassBlock;
  public states: BlockStates;

  public textures: WebGLTextureData[];
  public outlines: number[];

  constructor(options: BlockOptions) {
    super({ transparent: true, ...options });

    this.type = BlockType.GlassBlock;
    this.states = { power: 0, source: false };

    this.textures = glass.textures;
    this.outlines = glass.outlines;
  }

  PPUpdate() {}
}

export default GlassBlock;