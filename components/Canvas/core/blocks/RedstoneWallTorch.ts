import { redstone_wall_torch_off, redstone_wall_torch } from "@/public/json/blocks";
import { BlockOptions, FourFacings, RedstoneWallTorchStates, SixSides, Vector3, WebGLData } from "../../types";
import { Maps } from "../utils";
import RedstoneTorchBase from "./RedstoneTorchBase";

class RedstoneWallTorch extends RedstoneTorchBase {
  public states: RedstoneWallTorchStates;

  constructor(options: BlockOptions) {
    super({ needSupport: true, transparent: true, redstoneAutoConnect: 'full', ...options });

    this.states = { power: 0, source: true, lit: true, facing: 'north' };

    this.setFacing(options.normDir, options.facingDir);
  }

  get power() {
    return this.states.lit ? 15 : 0;
  }

  get supportingBlock() {
    const [x, y, z] = this.supportingBlockCoords;
    return this.engine.block(x, y, z);
  }

  get textures() {
    return _model[+this.states.lit][this.states.facing].textures;
  }

  get outlines() {
    return _model[+this.states.lit][this.states.facing].outlines;
  }


  private supportingBlockCoords: Vector3 = [this.x, this.y, this.z + 1];

  /**
   * 設定紅石火把面向的方向
   * @param normDir 指定面的法向量方向
   * @param facingDir 與觀察視角最接近的軸向量方向
   */
  private setFacing(normDir?: SixSides, facingDir?: FourFacings) {
    if (!normDir || !facingDir) return;
    if (normDir === 'down' || normDir === 'up') return;

    this.states.facing = normDir;
    const [x, y, z] = Maps.P6DMap[normDir];
    this.supportingBlockCoords = [this.x - x, this.y - y, this.z - z];
  }
}

export default RedstoneWallTorch;

const _model: [Record<FourFacings, WebGLData>, Record<FourFacings, WebGLData>] = 
  [redstone_wall_torch_off, redstone_wall_torch];