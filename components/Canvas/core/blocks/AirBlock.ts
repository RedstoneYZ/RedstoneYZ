import { BlockOptions, BlockStates, BlockType, WebGLTextureData } from "../../typings/types";
import Block from "./Block";

/**
 * 代表一個空氣方塊
 */
class AirBlock extends Block {
  public type: BlockType.AirBlock;
  public states: BlockStates;

  public textures: WebGLTextureData[];
  public outlines: number[];

  constructor(options: BlockOptions) {
    super({ transparent: true, ...options });

    this.type = BlockType.AirBlock;
    this.states = { power: 0, source: false };

    this.textures = [];
    this.outlines = [];
  }

  PPUpdate() {}
}

export default AirBlock;