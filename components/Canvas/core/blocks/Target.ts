import FullBlock from "./FullBlock";
import { target } from "@/public/json/blocks";
import { BlockOptions, BlockStates, BlockType, WebGLTextureData } from "../../typings/types";

/**
 * 代表一個鐵方塊，即不透明的單位方塊
 */
class Target extends FullBlock {
  public type: BlockType.Target;
  public states: BlockStates;

  public textures: WebGLTextureData[];
  public outlines: number[];

  constructor(options: BlockOptions) {
    super({ redstoneAutoConnect: 'full', ...options });

    this.type = BlockType.Target;
    this.states = { power: 0, source: false };

    this.textures = target.textures;
    this.outlines = target.outlines;
  }
}

export default Target;