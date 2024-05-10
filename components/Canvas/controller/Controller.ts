import Engine from "../model/Engine";
import Renderer from "../view";

import type { FourFacings, ControllerOptions } from "../model/types";
import { BlockType } from "../model/types";
import blockNameTable from "../model/utils/blockNameTable";
import Player from "./Player";

/**
 * The interface of the engine
 */
class Controller {
  public player: Player;

  public activeKeys: Set<string>;
  public hotbar: BlockType[];
  public hotbarIndex: number;

  public engine: Engine;
  public renderer: Renderer;

  public needRender: boolean;
  public alive: boolean;

  constructor({ canvas, xLen, yLen, zLen, mapName, preLoadData }: ControllerOptions) {
    this.player = new Player();

    this.activeKeys = new Set();
    this.hotbar = preLoadData?.availableBlocks ?? [
      BlockType.CommandBlock,
      BlockType.IronBlock,
      BlockType.Glass,
      BlockType.RedstoneDust,
      BlockType.RedstoneTorch,
      BlockType.RedstoneRepeater,
      BlockType.RedstoneComparator,
      BlockType.RedstoneLamp,
      BlockType.Lever,
    ];
    this.hotbarIndex = 0;

    this.engine = preLoadData
      ? Engine.spawn(preLoadData)
      : new Engine({ xLen, yLen, zLen, mapName });
    this.renderer = new Renderer(this, canvas, [xLen, yLen, zLen]);

    this.needRender = true;
    this.alive = true;
  }

  get currentBlockName(): string {
    return blockNameTable[this.hotbar[this.hotbarIndex]];
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

  public addActiveKey(key: string) {
    if (!this.validInputs.has(key)) return false;
    this.activeKeys.add(key);
    return true;
  }

  removeActiveKey(key: string) {
    this.activeKeys.delete(key);
  }

  public jumpHotbar(key: string) {
    if (!(key in this.hotbarMap)) return false;
    this.hotbarIndex = this.hotbarMap[key as keyof typeof this.hotbarMap];
    this.prevRefWheel = this.hotbarIndex * 100;
    return true;
  }

  scrollHotbar(deltaY: number): void {
    this.prevRefWheel += deltaY;
    if (!this.hotbar.length) return;

    this.hotbarIndex =
      ((Math.trunc(this.prevRefWheel / 100) % this.hotbar.length) + this.hotbar.length) %
      this.hotbar.length;
  }

  leftClick(): void {
    const target = this.renderer.getTarget();
    if (!target) return;

    const [x, y, z] = target;

    this.engine.addTask(["leftClick", [x, y, z], 0]);
    this.needRender = true;
  }

  middleClick(): void {
    const target = this.renderer.getTarget();
    if (!target) return;

    const [x, y, z] = target;
    const block = this.engine.block(x, y, z);
    if (!block) return;

    const index = this.hotbar.findIndex((e) => e === block.type);
    if (index < 0) {
      this.hotbar[this.hotbarIndex] = block.type;
    } else {
      this.hotbarIndex = index;
      this.prevRefWheel = index * 100;
    }

    this.needRender = true;
  }

  rightClick(shift: boolean): void {
    const target = this.renderer.getTarget();
    if (!target) return;

    const [x, y, z, ...normDir] = target;
    const facingArray: FourFacings[] = ["north", "east", "south", "west", "north"];
    const index = Math.round(((this.player.facing.yaw + Math.PI) * 2) / Math.PI);
    const facing = facingArray[index];

    this.engine.addTask([
      "rightClick",
      [x, y, z, shift, normDir, facing, this.hotbar[this.hotbarIndex] ?? BlockType.AirBlock],
      0,
    ]);
    this.needRender = true;
  }

  mouseMove(canvasX: number, canvasY: number): void {
    this.renderer.setLookAt(canvasX, canvasY);
  }

  destroy(): void {
    this.alive = false;
    this.engine.destroy();
  }

  private physics = () => {
    if (this.activeKeys.has("w")) {
      if (this.activeKeys.has("s")) this.player.moveStop();
      else this.player.moveForward();
    }
    if (this.activeKeys.has("s")) {
      if (this.activeKeys.has("w")) this.player.moveStop();
      else this.player.moveBackward();
    }
    if (this.activeKeys.has("a")) {
      if (this.activeKeys.has("d")) this.player.moveStop();
      else this.player.moveLeft();
    }
    if (this.activeKeys.has("d")) {
      if (this.activeKeys.has("a")) this.player.moveStop();
      else this.player.moveRight();
    }
    if (this.activeKeys.has(" ")) {
      if (this.activeKeys.has("shift")) this.player.moveStop();
      else this.player.moveUp();
    }
    if (this.activeKeys.has("shift")) {
      if (this.activeKeys.has(" ")) this.player.moveStop();
      else this.player.moveDown();
    }

    if (this.player.velocity > 0) {
      this.needRender = true;
    }

    this.player.advance();
  };

  private readonly validInputs = new Set([
    "w",
    "a",
    "s",
    "d",
    " ",
    "shift",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "!",
    "@",
    "#",
    "$",
    "%",
    "^",
    "&",
    "*",
    "(",
  ]);

  private readonly hotbarMap = {
    "1": 0,
    "2": 1,
    "3": 2,
    "4": 3,
    "5": 4,
    "6": 5,
    "7": 6,
    "8": 7,
    "9": 8,
    "!": 0,
    "@": 1,
    "#": 2,
    $: 3,
    "%": 4,
    "^": 5,
    "&": 6,
    "*": 7,
    "(": 8,
  };
}

export default Controller;
