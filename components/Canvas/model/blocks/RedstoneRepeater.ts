import type { BlockOptions, FourFacings, SixSides, Vector3 } from "../types";
import { BlockType } from "../types";
import { Maps } from "../utils";
import Block from "./Block";

class RedstoneRepeater extends Block {
  public type: BlockType.RedstoneRepeater;
  public states: RedstoneRepeaterState;

  constructor(options: BlockOptions, facing: FourFacings) {
    super({ transparent: true, redirectRedstone: "line", ...options });

    this.type = BlockType.RedstoneRepeater;
    this.states = this.setStates(facing);
    this.attachedFace = "up";
  }

  override get power() {
    return 0;
  }

  override get supportingBlock() {
    return this.engine.block(this.x, this.y - 1, this.z);
  }

  override powerTowardsBlock(direction: SixSides): { strong: boolean; power: number } {
    return this.states.powered && Maps.ReverseDir[direction] === this.states.facing
      ? { strong: true, power: 15 }
      : { strong: false, power: 0 };
  }

  override powerTowardsWire(direction: SixSides): { strong: boolean; power: number } {
    return this.states.powered && Maps.ReverseDir[direction] === this.states.facing
      ? { strong: true, power: 15 }
      : { strong: false, power: 0 };
  }

  interact() {
    this.states.delay = this.states.delay === 4 ? 1 : this.states.delay + 1;
    this.sendPPUpdate();
  }

  // temprarily take PP and NC update as the same
  override PPUpdate() {
    super.PPUpdate();

    const powered = this.currentPowered;
    const locked = this.currentLocked;

    if (!locked && this.states.powered !== powered) {
      this.engine.addTask([
        "repeaterUpdate",
        [this.x, this.y, this.z, powered],
        this.states.delay * 2,
      ]);
    }
    if (this.states.locked !== locked) {
      this.states.locked = locked;
      this.sendPPUpdate();
    }
  }

  repeaterUpdate(powered: boolean) {
    if (!powered && this.currentPowered) {
      return;
    }

    this.states.powered = powered;
    this.sendPPUpdate();
  }

  private _left: FourFacings = "east";
  private _right: FourFacings = "west";
  private _backCoords: Vector3 = [this.x, this.y, this.z + 1];
  private _leftCoords: Vector3 = [this.x - 1, this.y, this.z];
  private _rightCoords: Vector3 = [this.x + 1, this.y, this.z];

  private setStates(facing: FourFacings): RedstoneRepeaterState {
    this._left = ({ north: "east", east: "south", south: "west", west: "north" } as const)[facing];
    this._right = ({ north: "west", west: "south", south: "east", east: "north" } as const)[facing];

    let x: number, y: number, z: number;
    [x, y, z] = Maps.P4DMap[facing];
    this._backCoords = [this.x + x, this.y + y, this.z + z];

    [x, y, z] = Maps.P4DMap[this._left];
    this._leftCoords = [this.x + x, this.y + y, this.z + z];

    [x, y, z] = Maps.P4DMap[this._right];
    this._rightCoords = [this.x + x, this.y + y, this.z + z];

    return { delay: 1, facing, locked: false, powered: false };
  }

  private get currentPowered() {
    const [bx, by, bz] = this._backCoords;

    const block = this.engine.block(bx, by, bz);
    return !!block?.powerTowardsWire(Maps.ReverseDir[this.states.facing]).power;
  }

  private get currentLocked() {
    const [lx, ly, lz] = this._leftCoords;
    const [rx, ry, rz] = this._rightCoords;

    let block = this.engine.block(lx, ly, lz);
    if (
      block?.type === BlockType.RedstoneRepeater &&
      block.powerTowardsWire(this._right).power > 0
    ) {
      return true;
    }

    block = this.engine.block(rx, ry, rz);
    if (block?.type === BlockType.RedstoneRepeater && block.powerTowardsWire(this._left).power) {
      return true;
    }

    return false;
  }
}

type RedstoneRepeaterState = {
  /** 紅石中繼器的延遲 */
  delay: number;

  /** 紅石中繼器的指向 */
  facing: FourFacings;

  /** 紅石中繼器是否被鎖定 */
  locked: boolean;

  /** 紅石中繼器是否被激發 */
  powered: boolean;
};

export default RedstoneRepeater;
