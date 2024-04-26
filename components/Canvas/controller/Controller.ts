import Engine from "../model/Engine";
import Renderer from "../view";

import { BlockType, FourFacings, ControllerOptions } from "../model/types";
import blockNameTable from "../model/utils/blockNameTable";
import Player from "./Player";

/**
 * The interface of the engine
 */
class Controller {
  public player: Player;

  public activeKeys: Set<string>;
  public hotbar: HotbarItem[];
  public hotbarIndex: number;

  public engine: Engine;
  public renderer: Renderer;

  public needRender: boolean;
  public alive: boolean;

  constructor({ canvas, xLen, yLen, zLen, mapName, preLoadData }: ControllerOptions) {
    this.player = new Player();

    this.activeKeys = new Set();
    this.hotbar = this.getHotbar(preLoadData?.availableBlocks ??
      [BlockType.AirBlock, BlockType.IronBlock, BlockType.Glass, BlockType.RedstoneDust, BlockType.RedstoneTorch, BlockType.RedstoneRepeater, BlockType.RedstoneComparator, BlockType.RedstoneLamp, BlockType.Lever]
    );
    this.hotbarIndex = 0;

    this.engine = preLoadData ? Engine.spawn(preLoadData) : new Engine({ xLen, yLen, zLen, mapName });
    this.renderer = new Renderer(this, canvas, [xLen, yLen, zLen]);

    this.needRender = true;
    this.alive = true;
  }

  get currentBlockName() {
    return this.hotbar[this.hotbarIndex].name;
  }

  /**
   * 初始化
   * @param canvas 
   */
  start(): void {
    this.engine.startTicking();
    this.renderer.startRendering(this.physics);
  }

  private prevRefX = 0;
  private prevRefY = 0;
  private prevRefWheel = 0;

  adjustAngles(cursorX: number, cursorY: number, init: boolean = false): void {
    if (!init) {
      const facing = this.player.facing;
      facing.yaw = facing.yaw + (this.prevRefX - cursorX) * 0.0078125;
      facing.yaw += facing.yaw < -Math.PI ? Math.PI * 2 : 0;
      facing.yaw += Math.PI < facing.yaw ? -Math.PI * 2 : 0;

      facing.pitch = facing.pitch - (this.prevRefY - cursorY) * 0.0078125;
      facing.pitch = Math.max(Math.min(facing.pitch, Math.PI / 2), -(Math.PI / 2));
      
      this.activeKeys.clear();
    }


    this.prevRefX = cursorX;
    this.prevRefY = cursorY;
    this.needRender = true;
  }

  private validInputs = new Set(['w', 'a', 's', 'd', ' ', 'Shift']);

  addActiveKey(key: string) {
    if (this.validInputs.has(key)) {
      this.activeKeys.add(key);
    }
  }

  removeActiveKey(key: string) {
    this.activeKeys.delete(key);
  }

  scrollHotbar(deltaY: number): void {
    this.prevRefWheel += deltaY;
    if (!this.hotbar.length) return;

    this.hotbarIndex = (Math.trunc(this.prevRefWheel / 100) % this.hotbar.length + this.hotbar.length) % this.hotbar.length;
    this.needRender = true;
  }

  leftClick(canvasX: number, canvasY: number): void {
    const target = this.renderer.getTarget(canvasX, canvasY);
    if (!target) return;

    const [x, y, z] = target;

    this.engine.addTask(['leftClick', [x, y, z], 0]);
    this.needRender = true;
  }

  rightClick(canvasX: number, canvasY: number, shift: boolean): void {
    const target = this.renderer.getTarget(canvasX, canvasY);
    if (!target) return;

    const [x, y, z, ...normDir] = target;
    const facingArray: FourFacings[] = ['south', 'east', 'north', 'west', 'south'];
    const facing = facingArray[Math.round(this.player.facing.pitch * 2 / Math.PI)];

    this.engine.addTask(['rightClick', [x, y, z, shift, normDir, facing, this.hotbar[this.hotbarIndex].block ?? BlockType.AirBlock], 0]);
    this.needRender = true;
  }

  /**
   * 不使用此畫布時必須呼叫此函式
   */
  destroy(): void {
    this.alive = false;
    this.engine.destroy();
  }

  private physics = () => {
    if (this.activeKeys.has('w')) {
      if(this.activeKeys.has('s')) this.player.moveStop();
      else this.player.moveForward();
    }
    if (this.activeKeys.has('s')) {
      if(this.activeKeys.has('w')) this.player.moveStop();
      else this.player.moveBackward();
    }
    if (this.activeKeys.has('a')) {
      if(this.activeKeys.has('d')) this.player.moveStop();
      else this.player.moveLeft();
    }
    if (this.activeKeys.has('d')) {
      if(this.activeKeys.has('a')) this.player.moveStop();
      else this.player.moveRight();
    }
    if (this.activeKeys.has(' ')) {
      if(this.activeKeys.has('Shift')) this.player.moveStop();
      else this.player.moveUp();
    }
    if (this.activeKeys.has('Shift')) {
      if(this.activeKeys.has(' ')) this.player.moveStop();
      else this.player.moveDown();
    }

    if (this.player.velocity > 0) {
      this.needRender = true;
    }
 
    this.player.advance();
  }

  private getHotbar(items: BlockType[]): HotbarItem[] {
    return items.map(block => {
      return { block, name: blockNameTable[block] }
    });
  }
}

interface HotbarItem {
  block: BlockType;
  name: string;
};

export default Controller;