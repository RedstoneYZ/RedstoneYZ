import { BlockType } from "../types";

const blockNameTable: Record<BlockType, string> = {
  [BlockType.AirBlock]:           '空氣', 
  [BlockType.Glass]:              '玻璃', 
  [BlockType.IronBlock]:          '鐵方塊', 
  [BlockType.Lever]:              '控制桿', 
  [BlockType.RedstoneComparator]: '紅石比較器', 
  [BlockType.RedstoneDust]:       '紅石粉', 
  [BlockType.RedstoneLamp]:       '紅石燈', 
  [BlockType.RedstoneRepeater]:   '紅石中繼器', 
  [BlockType.RedstoneTorch]:      '紅石火把', 
  [BlockType.RedstoneWallTorch]:  '紅石火把', 
  [BlockType.Target]:             '標靶'
};

export default blockNameTable;