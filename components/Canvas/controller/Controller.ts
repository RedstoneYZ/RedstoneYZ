import Engine from "../model/Engine";
import Renderer from "../view";

import type { FourFacings, ControllerOptions, MapData } from "../model/types";
import { BlockType } from "../model/types";
import blockNameTable from "../model/utils/blockNameTable";
import Player from "./Player";
import { DigitKey, KeyBoard, MovementKey } from "./types";

/**
 * The interface of the engine
 */
class Controller {
  public player: Player;

  public activeKeys: Set<KeyBoard>;
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
      BlockType.IronBlock,
      BlockType.Glass,
      BlockType.Target,
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

  start(tickFunc: () => void): void {
    this.engine.startTicking(() => {
      tickFunc();
      this.renderer.updatePlayground();
    });
    this.renderer.startRendering(this.physics);
  }

  extract(): MapData {
    return Engine.extract(this.engine);
  }

  private prevRefWheel = 0;
  adjustAngles(deltaX: number, deltaY: number): void {
    const facing = this.player.facing;
    facing.yaw = facing.yaw + deltaX * 0.00390625;
    facing.yaw += facing.yaw < -Math.PI ? Math.PI * 2 : 0;
    facing.yaw += Math.PI < facing.yaw ? -Math.PI * 2 : 0;

    facing.pitch = facing.pitch - deltaY * 0.00390625;
    facing.pitch = Math.max(Math.min(facing.pitch, Math.PI / 2), -(Math.PI / 2));

    this.needRender = true;
  }

  public addActiveKey(key: string): boolean {
    if (!Controller.IsMovementKey(key)) return false;
    this.activeKeys.add(key);
    return true;
  }

  public removeActiveKey(key: string): boolean {
    if (!Controller.IsMovementKey(key)) return false;
    return this.activeKeys.delete(key);
  }

  public jumpHotbar(key: string) {
    if (!Controller.IsDigitKey(key)) return false;
    this.hotbarIndex = this.hotbarMap[key];
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

  destroy(): void {
    this.alive = false;
    this.engine.destroy();
  }

  private physics = () => {
    if (this.activeKeys.has(KeyBoard.W)) {
      this.player.moveForward();
    }
    if (this.activeKeys.has(KeyBoard.S)) {
      this.player.moveBackward();
    }
    if (this.activeKeys.has(KeyBoard.A)) {
      this.player.moveLeft();
    }
    if (this.activeKeys.has(KeyBoard.D)) {
      this.player.moveRight();
    }
    if (this.activeKeys.has(KeyBoard.Space)) {
      this.player.moveUp();
    }
    if (this.activeKeys.has(KeyBoard.LeftShift)) {
      this.player.moveDown();
    }

    if (this.player.velocity > 0) {
      this.needRender = true;
    }

    this.player.advance();
  };

  private static IsMovementKey(key: string): key is MovementKey {
    return (
      key === KeyBoard.W ||
      key === KeyBoard.A ||
      key === KeyBoard.S ||
      key === KeyBoard.D ||
      key === KeyBoard.LeftShift ||
      key === KeyBoard.Space
    );
  }

  private static IsDigitKey(key: string): key is DigitKey {
    return (
      key === KeyBoard.D1 ||
      key === KeyBoard.D2 ||
      key === KeyBoard.D3 ||
      key === KeyBoard.D4 ||
      key === KeyBoard.D5 ||
      key === KeyBoard.D6 ||
      key === KeyBoard.D7 ||
      key === KeyBoard.D8 ||
      key === KeyBoard.D9
    );
  }

  private readonly hotbarMap = {
    [KeyBoard.D1]: 0, 
    [KeyBoard.D2]: 1, 
    [KeyBoard.D3]: 2, 
    [KeyBoard.D4]: 3, 
    [KeyBoard.D5]: 4, 
    [KeyBoard.D6]: 5, 
    [KeyBoard.D7]: 6, 
    [KeyBoard.D8]: 7, 
    [KeyBoard.D9]: 8, 
  };
}

export default Controller;
