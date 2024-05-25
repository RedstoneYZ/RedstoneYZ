import type { BlockOptions, BlockState, Blocks, FourFacings, SixSides, ThreeFaces } from "../types";
import { BlockType } from "../types";
import {
  AirBlock,
  IronBlock,
  Glass,
  Lever,
  RedstoneComparator,
  RedstoneDust,
  RedstoneLamp,
  RedstoneRepeater,
  RedstoneTorch,
  RedstoneWallTorch,
  Target,
  CommandBlock,
} from "../blocks";
import Maps from "./Maps";

function NewBlock(
  type: BlockType,
  options: BlockOptions & { normDir: SixSides; facingDir: FourFacings },
): Blocks;
function NewBlock<T extends BlockState>(
  type: BlockType,
  options: Omit<BlockOptions, "normDir" | "facingDir">,
  states: T,
): Blocks;
function NewBlock<T extends BlockState>(
  type: BlockType,
  options: BlockOptions,
  states?: T,
): Blocks {
  switch (type) {
    case BlockType.AirBlock:
      return new AirBlock(options);

    case BlockType.CommandBlock:
      return new CommandBlock(options);

    case BlockType.IronBlock:
      return new IronBlock(options);

    case BlockType.Glass:
      return new Glass(options);

    case BlockType.Lever:
      if (states) {
        if (!("face" in states) || !("facing" in states)) {
          throw new Error();
        }
        return new Lever(options, states.face as ThreeFaces, states.facing as FourFacings);
      }

      if (options.normDir === "up") {
        return new Lever(options, "floor", Maps.ReverseDir[options.facingDir!]);
      } else if (options.normDir === "down") {
        return new Lever(options, "ceiling", Maps.ReverseDir[options.facingDir!]);
      } else {
        return new Lever(options, "wall", options.normDir!);
      }

    case BlockType.RedstoneComparator:
      if (states) {
        if (!("facing" in states)) {
          throw new Error();
        }
        return new RedstoneComparator(options, states.facing as FourFacings);
      }
      return new RedstoneComparator(options, Maps.ReverseDir[options.facingDir!]);

    case BlockType.RedstoneDust:
      return new RedstoneDust(options);

    case BlockType.RedstoneLamp:
      return new RedstoneLamp(options);

    case BlockType.RedstoneRepeater:
      if (states) {
        if (!("facing" in states)) {
          throw new Error();
        }
        return new RedstoneRepeater(options, states.facing as FourFacings);
      }
      return new RedstoneRepeater(options, Maps.ReverseDir[options.facingDir!]);

    case BlockType.RedstoneTorch:
    case BlockType.RedstoneWallTorch:
      if (states) {
        if (!("facing" in states)) {
          return new RedstoneTorch(options);
        }
        return new RedstoneWallTorch(options, states.facing as FourFacings);
      }
      if (options.normDir === "up" || options.normDir === "down") {
        return new RedstoneTorch(options);
      }
      return new RedstoneWallTorch(options, options.normDir!);

    case BlockType.Target:
      return new Target(options);
  }
}

export default NewBlock;
