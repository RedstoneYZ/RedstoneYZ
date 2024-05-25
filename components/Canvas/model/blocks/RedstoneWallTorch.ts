import type { BlockOptions, FourFacings, Vector3 } from "../types";
import { BlockType } from "../types";
import { Maps } from "../utils";
import RedstoneTorchBase from "./RedstoneTorchBase";

class RedstoneWallTorch extends RedstoneTorchBase {
  public override states: RedstoneWallTorchState;

  constructor(options: BlockOptions, facing: FourFacings) {
    super({ transparent: true, ...options });

    this.type = BlockType.RedstoneWallTorch;
    this.states = { lit: true, facing };
    this.setFacing(facing);
  }

  override get supportingBlock() {
    const [x, y, z] = this.supportingBlockCoords;
    return this.engine.block(x, y, z);
  }

  private supportingBlockCoords: Vector3 = [this.x, this.y, this.z + 1];

  private setFacing(facing: FourFacings): RedstoneWallTorchState {
    this.attachedFace = facing;
    const [x, y, z] = Maps.P6DMap[facing];
    this.supportingBlockCoords = [this.x - x, this.y - y, this.z - z];

    return { lit: true, facing };
  }
}

type RedstoneWallTorchState = {
  /** 紅石火把是否被觸發 */
  lit: boolean;
  /** 紅石火把面向的方向 */
  facing: FourFacings;
};

export default RedstoneWallTorch;
