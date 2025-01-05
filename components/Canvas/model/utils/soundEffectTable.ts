import { BlockType } from "../types";

interface SoundPath {
  dig: string[];
  place: string[];
}

const SoundEffectTable: Record<BlockType, SoundPath> = {
  [BlockType.CommandBlock]: {
    dig: ["stone1.ogg", "stone2.ogg", "stone3.ogg", "stone4.ogg"],
    place: ["stone1.ogg", "stone2.ogg", "stone3.ogg", "stone4.ogg"],
  },
  [BlockType.Glass]: {
    dig: ["glass1.ogg", "glass2.ogg", "glass3.ogg"],
    place: ["stone1.ogg", "stone2.ogg", "stone3.ogg", "stone4.ogg"],
  },
  [BlockType.IronBlock]: {
    dig: ["stone1.ogg", "stone2.ogg", "stone3.ogg", "stone4.ogg"],
    place: ["stone1.ogg", "stone2.ogg", "stone3.ogg", "stone4.ogg"],
  },
  [BlockType.Lever]: {
    dig: ["stone1.ogg", "stone2.ogg", "stone3.ogg", "stone4.ogg"],
    place: ["stone1.ogg", "stone2.ogg", "stone3.ogg", "stone4.ogg"],
  },
  [BlockType.RedstoneComparator]: {
    dig: ["stone1.ogg", "stone2.ogg", "stone3.ogg", "stone4.ogg"],
    place: ["stone1.ogg", "stone2.ogg", "stone3.ogg", "stone4.ogg"],
  },
  [BlockType.RedstoneDust]: {
    dig: ["stone1.ogg", "stone2.ogg", "stone3.ogg", "stone4.ogg"],
    place: ["stone1.ogg", "stone2.ogg", "stone3.ogg", "stone4.ogg"],
  },
  [BlockType.RedstoneLamp]: {
    dig: ["glass1.ogg", "glass2.ogg", "glass3.ogg"],
    place: ["stone1.ogg", "stone2.ogg", "stone3.ogg", "stone4.ogg"],
  },
  [BlockType.RedstoneRepeater]: {
    dig: ["stone1.ogg", "stone2.ogg", "stone3.ogg", "stone4.ogg"],
    place: ["stone1.ogg", "stone2.ogg", "stone3.ogg", "stone4.ogg"],
  },
  [BlockType.RedstoneTorch]: {
    dig: ["wood1.ogg", "wood2.ogg", "wood3.ogg", "wood4.ogg"],
    place: ["wood1.ogg", "wood2.ogg", "wood3.ogg", "wood4.ogg"],
  },
  [BlockType.RedstoneWallTorch]: {
    dig: ["wood1.ogg", "wood2.ogg", "wood3.ogg", "wood4.ogg"],
    place: ["wood1.ogg", "wood2.ogg", "wood3.ogg", "wood4.ogg"],
  },
  [BlockType.Target]: {
    dig: ["grass1.ogg", "grass2.ogg", "grass3.ogg", "grass4.ogg"],
    place: ["grass1.ogg", "grass2.ogg", "grass3.ogg", "grass4.ogg"],
  },
  [BlockType.AirBlock]: { dig: [], place: [] },
};

export default SoundEffectTable;
