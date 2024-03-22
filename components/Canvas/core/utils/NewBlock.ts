import { BlockOptions, BlockStates, BlockType, Blocks, FourFacings, SixSides } from "../../typings/types";
import { AirBlock, IronBlock, GlassBlock, Lever, RedstoneComparator, RedstoneDust, RedstoneLamp, RedstoneRepeater, RedstoneTorch, RedstoneWallTorch, Target } from "../blocks";

/**
 * 根據給定的方塊種類與狀態，回傳對應的 constructor
 */
function NewBlock(
  type: BlockType, options: BlockOptions & ({ normDir: SixSides, facingDir: FourFacings })
): Blocks;
function NewBlock<T extends BlockStates>(
  type: BlockType, options: Omit<BlockOptions, 'normDir' | 'facingDir'>, states: T
): Blocks;
function NewBlock<T extends BlockStates>(type: BlockType, options: BlockOptions, states?: T): Blocks {
  if (type === BlockType.RedstoneTorch) {
    if (options.normDir && options.facingDir) {
      return options.normDir === 'up' || options.normDir === 'down' ?
        new RedstoneTorch(options) : new RedstoneWallTorch(options);
    }
    else if (states) {
      if ('facing' in states) {
        const block = new RedstoneWallTorch(options);
        block.states.facing = states.facing as FourFacings;
        return block;
      }
      return new RedstoneTorch(options);
    }
    else {
      throw new Error();
    }
  }

  switch (type) {
    case BlockType.AirBlock:
      return new AirBlock(options);
      
    case BlockType.IronBlock:
      return new IronBlock(options);
      
    case BlockType.GlassBlock:
      return new GlassBlock(options);
      
    case BlockType.Lever:
      return new Lever(options);

    case BlockType.RedstoneDust:
      return new RedstoneDust(options);
      
    case BlockType.RedstoneLamp:
      return new RedstoneLamp(options);
      
    case BlockType.RedstoneRepeater:
      return new RedstoneRepeater(options);
      
    case BlockType.RedstoneComparator:
      return new RedstoneComparator(options);

    case BlockType.Target:
      return new Target(options);
  }
}

export default NewBlock;