import Engine from "./Engine";
import Renderer from "./Renderer";

import { BlockType, FourFacings, PlaygroundAngles, PlaygroundOptions } from "./typings/types";
import blockNameTable from "./core/utils/blockNameTable";

/**
 * 3D 渲染的邏輯實作
 */
class Playground {
  public angles: PlaygroundAngles;

  public hotbar: BlockType[];
  public hotbarNames: string[];
  public hotbarIndex: number;

  public engine: Engine;
  public renderer: Renderer;

  public needRender: boolean;
  public alive: boolean;

  constructor({ xLen, yLen, zLen, mapName, preLoadData }: PlaygroundOptions) {
    this.angles = { theta: 0, phi: 0 };

    this.hotbar = preLoadData?.availableBlocks ??
      [BlockType.AirBlock, BlockType.IronBlock, BlockType.GlassBlock, BlockType.RedstoneDust, BlockType.RedstoneTorch, BlockType.RedstoneRepeater, BlockType.RedstoneComparator, BlockType.RedstoneLamp, BlockType.Lever];
    this.hotbarNames = this.hotbar.map(t => blockNameTable[t]);
    this.hotbarIndex = 0;

    this.engine = preLoadData ? Engine.spawn(preLoadData) : new Engine({ xLen, yLen, zLen, mapName });
    this.renderer = new Renderer(this, [xLen, yLen, zLen]);

    this.needRender = true;
    this.alive = true;
  }

  get currentBlockName() {
    return this.hotbarNames[this.hotbarIndex];
  }

  /**
   * 初始化
   * @param canvas 
   */
  initialize(canvas: HTMLCanvasElement): void {
    this.engine.startTicking();
    this.renderer.initialize(canvas);
  }

  private _prevRefX = 0;
  private _prevRefY = 0;
  private _prevRefWheel = 0;

  /**
   * 根據當前游標與先前座標的差距來調整觀察者角度
   * @param cursorX 游標在網頁上的 x 座標
   * @param cursorY 游標在網頁上的 y 座標
   * @param init 是否僅初始化
   */
  adjustAngles(cursorX: number, cursorY: number, init: boolean = false): void {
    if (!init) {
      this.angles = {
        theta: this.angles.theta + (this._prevRefX - cursorX) * 0.0087, 
        phi: Math.max(Math.min(this.angles.phi + (this._prevRefY - cursorY) * 0.0087, Math.PI / 2), -(Math.PI / 2))
      };
      if (this.angles.theta < 0) {
        this.angles.theta += Math.PI * 2;
      }
      if (Math.PI * 2 < this.angles.theta) {
        this.angles.theta -= Math.PI * 2;
      }
    }

    this._prevRefX = cursorX;
    this._prevRefY = cursorY;
    this.needRender = true;
  }

  /**
   * 根據滾輪滾動的幅度調整快捷欄
   * @param deltaY 滾輪滾動的幅度
   */
  scrollHotbar(deltaY: number): void {
    this._prevRefWheel += deltaY;
    if (!this.hotbar.length) return;

    this.hotbarIndex = (Math.trunc(this._prevRefWheel / 100) % this.hotbar.length + this.hotbar.length) % this.hotbar.length;
    this.needRender = true;
  }

  /**
   * 在游標指定的位置上按下破壞鍵
   * @param cursorX 游標在畫布上的 x 座標
   * @param cursorY 游標在畫布上的 y 座標
   */
  leftClick(canvasX: number, canvasY: number): void {
    const target = this.renderer.getTarget(canvasX, canvasY);
    if (!target) return;

    const [x, y, z] = target;

    this.engine.addTask(['leftClick', [x, y, z], 0]);
    this.needRender = true;
  }

  /**
   * 在游標指定的位置上按下使用鍵
   * @param cursorX 游標在畫布上的 x 座標
   * @param cursorY 游標在畫布上的 y 座標
   * @param shiftDown 是否有按下 Shift 鍵
   */
  rightClick(canvasX: number, canvasY: number, shiftDown: boolean): void {
    const target = this.renderer.getTarget(canvasX, canvasY);
    if (!target) return;

    const [x, y, z, ...normDir] = target;
    const facingArray: FourFacings[] = ['north', 'west', 'south', 'east', 'north'];
    const facing = facingArray[Math.round(this.angles.theta * 2 / Math.PI)];
    
    this.engine.addTask(['rightClick', [x, y, z, shiftDown, normDir, facing, this.hotbar[this.hotbarIndex] ?? BlockType.AirBlock], 0]);
    this.needRender = true;
  }

  /**
   * 不使用此畫布時必須呼叫此函式
   */
  destroy(): void {
    this.alive = false;
    this.engine.destroy();
  }
}

export default Playground;