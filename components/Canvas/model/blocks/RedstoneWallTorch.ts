import { BlockOptions, BlockType, FourFacings, SixSides, Vector3 } from "../types";
import { Maps } from "../utils";
import RedstoneTorchBase from "./RedstoneTorchBase";

class RedstoneWallTorch extends RedstoneTorchBase {
  public override states: RedstoneWallTorchState;

  constructor(options: BlockOptions) {
    super({ needSupport: true, transparent: true, redirectRedstone: "full", ...options });

    this.type = BlockType.RedstoneWallTorch;
    this.states = { lit: true, facing: "north" };
    this.setFacing(options.normDir, options.facingDir);
  }

  override get supportingBlock() {
    const [x, y, z] = this.supportingBlockCoords;
    return this.engine.block(x, y, z);
  }

  private supportingBlockCoords: Vector3 = [this.x, this.y, this.z + 1];

  /**
   * 設定紅石火把面向的方向
   * @param normDir 指定面的法向量方向
   * @param facingDir 與觀察視角最接近的軸向量方向
   */
  private setFacing(normDir?: SixSides, facingDir?: FourFacings) {
    if (!normDir || !facingDir) return;
    if (normDir === "down" || normDir === "up") return;

    this.states.facing = normDir;
    const [x, y, z] = Maps.P6DMap[normDir];
    this.supportingBlockCoords = [this.x - x, this.y - y, this.z - z];
  }
}

type RedstoneWallTorchState = {
  /** 紅石火把是否被觸發 */
  lit: boolean;
  /** 紅石火把面向的方向 */
  facing: FourFacings;
};

export default RedstoneWallTorch;
