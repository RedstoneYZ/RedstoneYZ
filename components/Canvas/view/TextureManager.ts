import Textures from "@/public/static/images/atlas/atlas.json";
import type { Vector2, Vector6 } from "../model/types";

export default class TextureManager {
  constructor() {}

  sample(name: string, tick: number = 0): Vector6 {
    if (!(name in Textures.block)) {
      // TODO: add missing.png
      throw new Error(`Texture ${name} does not exist in texture atlas.`);
    }

    const data = Textures.block[name as keyof typeof Textures.block] as TextureData;
    if (!("animation" in data && data.animation)) {
      const offset = data.offset[0];
      return [offset[0], offset[1], 0, 0, 1, 1];
    }

    const frametime = data.animation.frametime;
    const inter = frametime - (tick % frametime);
    const index1 = Math.floor(tick / frametime) % data.offset.length;
    const index2 = index1 + 1 === data.offset.length ? 0 : index1 + 1;

    const off1 = data.offset[index1];
    const off2 = data.offset[index2];
    return [off1[0], off1[1], off2[0], off2[1], inter, frametime];
  }
}

interface TextureData {
  offset: Vector2[];
  animation?: {
    interpolate: boolean;
    frametime: number;
  };
}
