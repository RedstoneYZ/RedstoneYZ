import Textures from "@/public/static/images/atlas/texture.json";
import { Vector2 } from "../model/types";

export default class TextureManager {
  public factor: Vector2;
  constructor() {
    this.factor = Textures.factor as Vector2;
  }

  sample(name: string, tick: number = 0): Vector2 {
    if (!(name in Textures.data)) {
      // TODO: add missing.png
      throw new Error(`Texture ${name} does not exist in texture atlas.`);
    }

    const data = Textures.data[name as keyof typeof Textures.data] as TextureData;
    if (!('animation' in data && data.animation)) {
      return data.offset[0];
    }

    const index = Math.floor(tick / data.animation.frametime) % data.offset.length;
    return data.offset[index];
  }
}

interface TextureData {
  offset: Vector2[];
  animation?: {
    interpolate: boolean;
    frametime: number;
  };
}