import { Maps } from "../utils";
import Block from "./Block";
import { strictEqual } from "../../model/utils";
import { BlockOptions, BlockType, FourFacings, SixSides } from "../types";

class RedstoneDust extends Block {
  public type: BlockType.RedstoneDust;
  public states: RedstoneDustState;

  public crossMode: boolean;

  constructor(options: BlockOptions) {
    super({ needBottomSupport: true, transparent: true, redirectRedstone: 'full', ...options });

    this.type = BlockType.RedstoneDust;
    this.states = { east: 1, south: 1, west: 1, north: 1 };
    this.crossMode = true;
  }

  override get power() {
    return this.internal.power;
  }

  get color() {
    return [105 + 10 * this.internal.power, 0, 0];
  }

  override get supportingBlock() {
    return this.engine.block(this.x, this.y - 1, this.z);
  }

  override powerTowardsBlock(direction: SixSides): { strong: boolean, power: number } {
    if (direction === 'up') return { strong: false, power: 0 };
    return direction === 'down' || this.states[direction] ?
      { strong: false, power: this.internal.power } :
      { strong: false, power: 0 };
  }

  override powerTowardsWire(direction: SixSides): { strong: boolean, power: number } {
    if (direction === 'up' || direction === 'down') return { strong: false, power: 0 };
    return this.states[direction] ?
      { strong: true, power: this.internal.power } :
      { strong: false, power: 0 };
  }

  /**
   * 與此紅石粉互動一次
   */
  interact() {
    this.crossMode = !this.crossMode;
    this.sendPPUpdate();
  }

  override sendPPUpdate() {
    this.engine.needRender = true;

    this.PPUpdate();
    Maps.P6DArray.forEach(([dir, [x, y, z]]) => {
      const target = this.engine.block(this.x + x, this.y + y, this.z + z);
      if (!target) return;

      target.PPUpdate();

      if (dir === 'up' || dir === 'down') return;

      // 如果有指向側邊，側邊的上下兩個方塊也要更新
      if (this.states[dir] && target.type !== BlockType.RedstoneDust) {
        this.engine.block(this.x + x, this.y + y - 1, this.z + z)?.PPUpdate();
        this.engine.block(this.x + x, this.y + y + 1, this.z + z)?.PPUpdate();
      }
    });
  }

  // temprarily take PP and NC update as the same
  override PPUpdate() {
    super.PPUpdate();

    const oldStates = JSON.parse(JSON.stringify(this.states)) as RedstoneDustState;
    this.internal.power = this.states.east = this.states.west = this.states.south = this.states.north = 0;

    Maps.P6DArray.forEach(([dir, [dx, dy, dz]]) => {
      const x = this.x + dx;
      const y = this.y + dy;
      const z = this.z + dz;
      const block = this.engine.block(x, y, z);
      if (!block) return;

      // 相鄰方塊是強充能方塊則充能製相同等級
      const { strong } = block.powerTowardsWire(Maps.ReverseDir[dir]);
      let { power } = block.powerTowardsWire(Maps.ReverseDir[dir]);
      if (strong) {
        // 如果是紅石粉，訊號要遞減
        if (block.type === BlockType.RedstoneDust) {
          power--;
        }
        this.internal.power = Math.max(this.internal.power, power);
      }

      if (dir === 'up' || dir === 'down') return;

      // 四周方塊如果會連上紅石粉，就根據規則連上
      if (block.redirectRedstone) {
        if (
          block.redirectRedstone === 'full' || (
            block.redirectRedstone === 'line' &&
            'facing' in block.states &&
            [dir as SixSides, Maps.ReverseDir[dir]].includes(block.states.facing)
          )
        ) {
          this.states[dir] = 1;
        }
      }

      const sideDown = this.engine.block(x     , this.y - 1, z);
      const sideUp   = this.engine.block(x     , this.y + 1, z);
      const above    = this.engine.block(this.x, this.y + 1, this.z);

      // 側下方的紅石粉
      if (sideDown?.type === BlockType.RedstoneDust && block?.transparent) {
        this.states[dir] = 1;
        this.internal.power = Math.max(this.internal.power, sideDown.power - 1);
      }

      // 側上方的紅石粉
      if (sideUp?.type === BlockType.RedstoneDust && above?.transparent) {
        this.states[dir] = 2;
        this.internal.power = Math.max(this.internal.power, sideUp.power - 1);
      }
    });

    const explicitDir = Maps.P4DArray
      .map(([dir]) => this.states[dir] ? dir : undefined)
      .filter(a => a) as FourFacings[];

    if (explicitDir.length === 0) {
      if (this.crossMode) {
        this.states.east = this.states.south = this.states.west = this.states.north = 1;
      }
    }
    else {
      this.crossMode = true;
      if (explicitDir.length === 1) {
        this.states[Maps.ReverseDir[explicitDir[0]]] = 1;
      }
    }

    if (!strictEqual(oldStates, this.states)) {
      this.sendPPUpdate();
    }
  }
}

type RedstoneDustState = {
  /** 紅石粉東側的連接狀態，0 為無，1 為有，2 為有且向上 */
  east: 0 | 1 | 2;

  /** 紅石粉西側的連接狀態，0 為無，1 為有，2 為有且向上 */
  west: 0 | 1 | 2;

  /** 紅石粉北側的連接狀態，0 為無，1 為有，2 為有且向上 */
  north: 0 | 1 | 2;

  /** 紅石粉南側的連接狀態，0 為無，1 為有，2 為有且向上 */
  south: 0 | 1 | 2;
};

export default RedstoneDust;