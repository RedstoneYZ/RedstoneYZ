import type { BlockOptions, FourFacings, SixSides, ThreeFaces, Vector3 } from "../types";
import { BlockType } from "../types";
import { Maps } from "../utils";
import Block from "./Block";

class Lever extends Block {
  public type: BlockType.Lever;
  public states: LeverState;

  constructor(options: BlockOptions) {
    super({ transparent: true, redirectRedstone: "full", ...options });

    this.type = BlockType.Lever;
    this.states = { face: "wall", facing: "north", powered: false };
    this.setFacing(options.normDir, options.facingDir);
  }

  override get power() {
    return this.states.powered ? 15 : 0;
  }

  override get supportingBlock() {
    const [x, y, z] = this.supportingBlockCoords;
    return this.engine.block(x, y, z);
  }

  override powerTowardsBlock(direction: SixSides): { strong: boolean; power: number } {
    return ((this.states.face === "ceiling" && direction === "up") ||
      (this.states.face === "floor" && direction === "down") ||
      (this.states.face === "wall" && this.states.facing === Maps.ReverseDir[direction])) &&
      this.states.powered
      ? { strong: true, power: 15 }
      : { strong: false, power: 0 };
  }

  override powerTowardsWire(): { strong: boolean; power: number } {
    return { strong: this.states.powered, power: this.states.powered ? 15 : 0 };
  }

  interact() {
    this.states.powered = !this.states.powered;
    this.internal.source = this.states.powered;
    this.internal.power = this.states.powered ? 15 : 0;
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

    if (normDir === "up") {
      this.states.face = "floor";
      this.states.facing = Maps.ReverseDir[facingDir];
      this.attachedFace = "up";
      this.supportingBlockCoords = [this.x, this.y - 1, this.z];
    } else if (normDir === "down") {
      this.states.face = "ceiling";
      this.states.facing = Maps.ReverseDir[facingDir];
      this.attachedFace = "down";
      this.supportingBlockCoords = [this.x, this.y + 1, this.z];
    } else {
      this.states.face = "wall";
      this.states.facing = normDir;
      this.attachedFace = normDir;
      const [x, y, z] = Maps.P6DMap[normDir];
      this.supportingBlockCoords = [this.x - x, this.y - y, this.z - z];
    }
  }
}

type LeverState = {
  /** 控制桿的附著位置 */
  face: ThreeFaces;

  /** 控制桿的面向方向 */
  facing: FourFacings;

  /** 控制桿是否被拉下 */
  powered: boolean;
};

export default Lever;
