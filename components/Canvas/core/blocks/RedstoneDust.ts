import {
  redstone_dust_dot, redstone_dust_side0, redstone_dust_side1, redstone_dust_side_alt0, redstone_dust_side_alt1, redstone_dust_up
} from "@/public/json/blocks";
import { Maps } from "../utils";
import Block from "./Block";
import { strictEqual } from "../../../../utils";
import { BlockOptions, BlockType, FourFacings, RedstoneDustStates, SixSides, WebGLTextureData } from "../../types";

/**
 * 代表一個紅石粉方塊
 */
class RedstoneDust extends Block {
  public type: BlockType.RedstoneDust;
  public states: RedstoneDustStates;

  public crossMode: boolean;

  constructor(options: BlockOptions) {
    super({ needBottomSupport: true, transparent: true, redstoneAutoConnect: 'full', ...options });

    this.type = BlockType.RedstoneDust;
    this.states = { power: 0, source: false, east: 1, south: 1, west: 1, north: 1 };

    /** 此紅石粉閒置時是否處於向四周充能的狀態 */
    this.crossMode = true;
  }

  get power() {
    return this.states.power;
  }

  get color() {
    return [105 + 10 * this.states.power, 0, 0];
  }

  get supportingBlock() {
    return this.engine.block(this.x, this.y - 1, this.z);
  }

  get textures() {
    const { east: e, west: w, south: s, north: n } = this.states;
    return [
      ..._textureModel.north[n], 
      ..._textureModel.west[w], 
      ..._textureModel.south[s], 
      ..._textureModel.east[e], 
      ...(!s === !e || !n === !w || !n !== !s ? _textureModel.dot : [])
    ];
  }

  get outlines() {
    const { east: e, west: w, south: s, north: n } = this.states;
    return [
      ..._outlineModel.north[n], 
      ..._outlineModel.west[w], 
      ..._outlineModel.south[s], 
      ..._outlineModel.east[e], 
      ...(!s === !e || !n === !w || !n !== !s ? _outlineModel.dot : [])
    ];
  }

  powerTowardsBlock(direction: SixSides): { strong: boolean, power: number } {
    if (direction === 'up') return { strong: false, power: 0 };
    return direction === 'down' || this.states[direction] ?
      { strong: false, power: this.states.power } :
      { strong: false, power: 0 };
  }

  powerTowardsWire(direction: SixSides): { strong: boolean, power: number } {
    if (direction === 'up' || direction === 'down') return { strong: false, power: 0 };
    return this.states[direction] ?
      { strong: true, power: this.states.power } :
      { strong: false, power: 0 };
  }

  /**
   * 與此紅石粉互動一次
   */
  interact() {
    this.crossMode = !this.crossMode;
    this.sendPPUpdate();
  }

  sendPPUpdate() {
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
  PPUpdate() {
    super.PPUpdate();

    const oldStates = JSON.parse(JSON.stringify(this.states)) as RedstoneDustStates;
    this.states.power = this.states.east = this.states.west = this.states.south = this.states.north = 0;
    
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
        this.states.power = Math.max(this.states.power, power);
      }

      if (dir === 'up' || dir === 'down') return;

      // 四周方塊如果會連上紅石粉，就根據規則連上
      if (block.redstoneAutoConnect) {
        if (
          block.redstoneAutoConnect === 'full' || (
            block.redstoneAutoConnect === 'line' &&
            'facing' in block.states &&
            [dir, Maps.ReverseDir[dir]].includes(block.states.facing)
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
        this.states.power = Math.max(this.states.power, sideDown.power - 1);
      }

      // 側上方的紅石粉
      if (sideUp?.type === BlockType.RedstoneDust && above?.transparent) {
        this.states[dir] = 2;
        this.states.power = Math.max(this.states.power, sideUp.power - 1);
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

const _textureModel: {
  dot: WebGLTextureData[], 
  north: [WebGLTextureData[], WebGLTextureData[], WebGLTextureData[]], 
  west: [WebGLTextureData[], WebGLTextureData[], WebGLTextureData[]], 
  south: [WebGLTextureData[], WebGLTextureData[], WebGLTextureData[]], 
  east: [WebGLTextureData[], WebGLTextureData[], WebGLTextureData[]]
} = {
  dot: redstone_dust_dot.textures, 
  north: [
    [], 
    redstone_dust_side0.textures, 
    redstone_dust_side0.textures.concat(redstone_dust_up.north.textures)
  ], 
  west: [
    [], 
    redstone_dust_side1.textures, 
    redstone_dust_side1.textures.concat(redstone_dust_up.west.textures)
  ], 
  south: [
    [], 
    redstone_dust_side_alt0.textures, 
    redstone_dust_side_alt0.textures.concat(redstone_dust_up.south.textures)
  ], 
  east: [
    [], 
    redstone_dust_side_alt1.textures, 
    redstone_dust_side_alt1.textures.concat(redstone_dust_up.east.textures)
  ]
};

const _outlineModel: {
  dot: number[], 
  north: [number[], number[], number[]], 
  west: [number[], number[], number[]], 
  south: [number[], number[], number[]], 
  east: [number[], number[], number[]]
} = {
  dot: redstone_dust_dot.outlines, 
  north: [
    [], 
    redstone_dust_side0.outlines, 
    redstone_dust_side0.outlines.concat(redstone_dust_up.north.outlines)
  ], 
  west: [
    [], 
    redstone_dust_side1.outlines, 
    redstone_dust_side1.outlines.concat(redstone_dust_up.west.outlines)
  ], 
  south: [
    [], 
    redstone_dust_side_alt0.outlines, 
    redstone_dust_side_alt0.outlines.concat(redstone_dust_up.south.outlines)
  ], 
  east: [
    [], 
    redstone_dust_side_alt1.outlines, 
    redstone_dust_side_alt1.outlines.concat(redstone_dust_up.east.outlines)
  ]
};

export default RedstoneDust;