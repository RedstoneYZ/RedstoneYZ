import { lever, lever_on } from "@/public/json/blocks";
import { BlockOptions, BlockType, FourFacings, LeverStates, SixSides, ThreeFaces, Vector3, WebGLData } from "../../types";
import { Maps } from "../utils";
import Block from "./Block";

/**
 * 代表一個控制桿
 */
class Lever extends Block {
  public type: BlockType.Lever;
  public blockName: string;
  public states: LeverStates;

  constructor(options: BlockOptions) {
    super({ transparent: true, needSupport: true, redstoneAutoConnect: 'full', ...options });

    this.type = BlockType.Lever;
    this.blockName = '控制桿';
    this.states = { power: 0, source: false, face: 'wall', facing: 'north', powered: false };
    this.setFacing(options.normDir, options.facingDir);
  }

  get power() {
    return this.states.powered ? 15 : 0;
  }

  get supportingBlock() {
    const [x, y, z] = this.supportingBlockCoords;
    return this.engine.block(x, y, z);
  }

  get textures() {
    return _model[+this.states.powered][this.states.face][this.states.facing].textures;
  }

  get outlines() {
    return _model[+this.states.powered][this.states.face][this.states.facing].outlines;
  }

  powerTowardsBlock(direction: SixSides): { strong: boolean, power: number } {
    return (
      (this.states.face === 'ceiling' && direction === 'up') ||
      (this.states.face === 'floor' && direction === 'down') ||
      (this.states.face === 'wall' && this.states.facing === Maps.ReverseDir[direction])
    ) && this.states.powered ?
    { strong: true, power: 15 } :
    { strong: false, power: 0 };
  }

  powerTowardsWire(): { strong: boolean, power: number } {
    return { strong: this.states.powered, power: this.states.powered ? 15 : 0 };
  }

  interact() {
    this.states.powered = !this.states.powered;
    this.states.source = this.states.powered;
    this.sendPPUpdate();
  }


  private supportingBlockCoords: Vector3 = [this.x, this.y, this.z + 1];

  /**
   * 設定面向的方向
   * @param normDir 指定面的法向量方向
   * @param facingDir 與觀察視角最接近的軸向量方向
   */
  private setFacing(normDir?: SixSides, facingDir?: FourFacings) {
    if (!normDir || !facingDir) return;

    if (normDir === 'up') {
      this.states.face = 'floor';
      this.states.facing = Maps.ReverseDir[facingDir];
      this.supportingBlockCoords = [this.x, this.y - 1, this.z];
    }
    else if (normDir === 'down') {
      this.states.face = 'ceiling';
      this.states.facing = Maps.ReverseDir[facingDir];
      this.supportingBlockCoords = [this.x, this.y + 1, this.z];
    }
    else {
      this.states.face = 'wall';
      this.states.facing = normDir;
      const [x, y, z] = Maps.P6DMap[normDir];
      this.supportingBlockCoords = [this.x - x, this.y - y, this.z - z];
    }
  }
}

export default Lever;

const _model: [Record<ThreeFaces, Record<FourFacings, WebGLData>>, Record<ThreeFaces, Record<FourFacings, WebGLData>>] = [lever, lever_on];