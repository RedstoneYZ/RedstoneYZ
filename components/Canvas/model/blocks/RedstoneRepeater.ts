import { BlockOptions, BlockType, FourFacings, RedstoneRepeaterStates, SixSides, Vector3 } from "../types";
import { Maps } from "../utils";
import Block from "./Block";
import { BlockModelPath } from "../../view/types";

class RedstoneRepeater extends Block {
  public type: BlockType.RedstoneRepeater;
  public model: BlockModelPath.Repeater1tickOnLocked;
  public states: RedstoneRepeaterStates;

  constructor(options: BlockOptions) {
    super({ needBottomSupport: true, transparent: true, redstoneAutoConnect: 'line', ...options });
    
    this.type = BlockType.RedstoneRepeater;
    this.model = BlockModelPath.Repeater1tickOnLocked;
    this.states = { power: 0, source: false, delay: 1, facing: 'north', locked: false, powered: false };
    this.setFacing(options.normDir, options.facingDir);
  }

  override get power() {
    return 0;
  }

  override get supportingBlock() {
    return this.engine.block(this.x, this.y - 1, this.z);
  }

  overridepowerTowardsBlock(direction: SixSides): { strong: boolean, power: number } {
    return this.states.powered && direction === this.states.facing ?
      { strong: true, power: 15 } :
      { strong: false, power: 0 };
  }

  overridepowerTowardsWire(direction: SixSides): { strong: boolean, power: number } {
    return this.states.powered && direction === this.states.facing ?
      { strong: true, power: 15 } :
      { strong: false, power: 0 };
  }

  /**
   * 與此紅石中繼器互動一次
   */
  interact() {
    this.states.delay = this.states.delay === 4 ? 1 : this.states.delay + 1;
    this.sendPPUpdate();
  }

  // temprarily take PP and NC update as the same
  overridePPUpdate() {
    super.PPUpdate();

    const powered = this.currentPowered;
    const locked = this.currentLocked;

    if (!locked && this.states.powered !== powered) {
      this.engine.addTask(['repeaterUpdate', [this.x, this.y, this.z, powered], this.states.delay * 2]);
    }
    if (this.states.locked !== locked) {
      this.states.locked = locked;
      this.sendPPUpdate();
    }
  }

  /**
   * 更新此紅石中繼器的激發狀態
   */
  repeaterUpdate(powered: boolean) {
    if (!powered && this.currentPowered) {
      return;
    }

    this.states.powered = powered;
    this.sendPPUpdate();
  }


  private _left: FourFacings = 'east';
  private _right: FourFacings = 'west';
  private _backCoords: Vector3 = [this.x, this.y, this.z + 1];
  private _leftCoords: Vector3 = [this.x - 1, this.y, this.z];
  private _rightCoords: Vector3 = [this.x + 1, this.y, this.z];

  /**
   * 設定中繼器面向的方向
   * @param normDir 指定面的法向量方向
   * @param facingDir 與觀察視角最接近的軸向量方向
   */
  private setFacing(normDir?: SixSides, facingDir?: FourFacings) {
    if (!normDir || !facingDir) return;
    
    this.states.facing = facingDir ?? 'north';
    this._left = ({ north: 'east', east: 'south', south: 'west', west: 'north' } as const)[facingDir];
    this._right = ({ north: 'west', west: 'south', south: 'east', east: 'north' } as const)[facingDir];

    let x: number, y: number, z: number;
    [x, y, z] = Maps.P4DMap[Maps.ReverseDir[facingDir]];
    this._backCoords = [this.x + x, this.y + y, this.z + z];

    [x, y, z] = Maps.P4DMap[this._left];
    this._leftCoords = [this.x + x, this.y + y, this.z + z];

    [x, y, z] = Maps.P4DMap[this._right];
    this._rightCoords = [this.x + x, this.y + y, this.z + z];
  }

  private get currentPowered() {
    const [bx, by, bz] = this._backCoords;

    const block = this.engine.block(bx, by, bz);
    return !!block?.powerTowardsWire(this.states.facing).power;
  }

  private get currentLocked() {
    const [lx, ly, lz] = this._leftCoords;
    const [rx, ry, rz] = this._rightCoords;

    let block = this.engine.block(lx, ly, lz);
    if (block?.type === BlockType.RedstoneRepeater && block.powerTowardsWire(this._right).power > 0) {
      return true;
    }

    block = this.engine.block(rx, ry, rz);
    if (block?.type === BlockType.RedstoneRepeater && block.powerTowardsWire(this._left).power) {
      return true;
    }

    return false;
  }
}

export default RedstoneRepeater;
