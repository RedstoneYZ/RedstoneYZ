import { sleep, strictEqual } from "./utils";
import { AirBlock, Block, IronBlock, Lever, NewBlock, RedstoneLamp } from ".";
import blockNameTable from "./utils/blockNameTable";
import { BlockType, Blocks, EngineOptions, EngineTask, FourFacings, MapData, ValidationData, Vector3 } from "./types";

class Engine {
  public xLen: number;
  public yLen: number;
  public zLen: number;
  public mapName: string;
  public validation: ValidationData | undefined;

  public tick: number;
  public day: number;
  public taskQueue: EngineTask[];
  public needRender: boolean;

  private _pg: Blocks[][][];

  constructor({ xLen, yLen, zLen, mapName, validation }: EngineOptions) {
    this.xLen = xLen;
    this.yLen = yLen;
    this.zLen = zLen;
    this.mapName = mapName;
    this.validation = validation;

    this.tick = 0;
    this.day = 1;
    this.taskQueue = [];
    this.needRender = true;

    this._pg = Array.from({ length: xLen }, (_, x) => 
      Array.from({ length: yLen }, (_, y) => 
        Array.from({ length: zLen }, (_, z) => y === 0 ?
          new IronBlock({ x, y, z, engine: this, breakable: false }) :
          new AirBlock({ x, y, z, engine: this }))
      )
    );
  }

  static spawn({ xLen, yLen, zLen, mapName, blocks, validation }: MapData): Engine {
    const engine = new Engine({ xLen, yLen, zLen, mapName, validation });
    blocks.forEach((layer, i) => {
      layer.forEach((line, j) => {
        line.forEach((block, k) => {
          engine._pg[i][j][k] = block ? Block.spawn({ ...block, x: i, y: j, z: k, engine }) : new AirBlock({ x: i, y: j, z: k, engine });
        })
      })
    });
    return engine;
  }

  /**
   * 把一個引擎轉換成可儲存的資料形式
   * @param engine 
   * @returns 
   */
  static extract(engine: Engine): MapData {
    return {
      xLen: engine.xLen, 
      yLen: engine.yLen, 
      zLen: engine.zLen, 
      mapName: engine.mapName, 
      blocks: engine._pg.map(layer => {
        return layer.map(line => {
          return line.map(block => block.type === BlockType.AirBlock ? null : Block.extract(block));
        })
      })
    };
  }

  /**
   * 檢查控制感與紅石燈的關係是否符合給定布林表達式的要求
   * @param engine 
   */
  static async validate(engine: Engine): Promise<boolean> {
    if (!engine.validation) {
      throw new Error('This engine does not contain validation data.');
    }

    const { leverLocations, lampLocations, boolFuncs, timeout } = engine.validation;
    const leverBlocks: Lever[] = [];
    const lampBlocks: RedstoneLamp[] = []

    for (const [x, y, z] of leverLocations) {
      const block = engine.block(x, y, z);
      if (!block) continue;

      if (block.type !== BlockType.Lever) {
        throw new Error(`Position [${x}, ${y}, ${z}] is ${blockNameTable[block.type]}, not Lever.`);
      }
      if (block.states.powered) {
        block.interact();
      }
      leverBlocks.push(block);
    }

    for (const [x, y, z] of lampLocations) {
      const block = engine.block(x, y, z);
      if (!block) continue;

      if (block.type !== BlockType.RedstoneLamp) {
        throw new Error(`Position [${x}, ${y}, ${z}] is ${blockNameTable[block.type]}, not Redstone Lamp.`);
      }
      lampBlocks.push(block);
    }

    const count = Math.round(2 ** leverLocations.length);
    let output = true;
    for (let i = 1; i <= count; i++) {
      let temp = 1, c = 0;
      while (temp <= i && c < leverLocations.length) {
        if (i % temp === 0) {
          leverBlocks[c].interact();
        }
        temp <<= 1;
        c++;
      }

      await sleep(timeout);

      const leverStatus = leverBlocks.map(b => b.states.powered);
      const lampStatus = lampBlocks.map(b => b.states.lit);

      for (let i = 0; i < lampLocations.length; i++) {
        const func = boolFuncs[i];

        let ans = false;
        for (let j = 0; j < func.length; j++) {
          if (func[j].every(ele => ele > 0 ? leverStatus[ele - 1] : !leverStatus[-ele - 1])) {
            ans = true;
            break;
          }
        }

        if (ans !== lampStatus[i]) {
          output = false;
          break;
        }
      }

      if (!output) {
        break;
      }
    }

    leverBlocks.forEach(b => {
      if (b.states.powered) {
        b.interact();
      }
    });
    return output;
  }

  /**
   * 新增一項工作到工作佇列中
   */
  addTask(task: EngineTask): void {
    // 忽略重複的工作
    if (this.taskQueue.some(t => t[0] === task[0] && t[2] === task[2] && strictEqual(t[1], task[1]))) return;
    this.taskQueue.push(task);
  }

  /**
   * 取得指定座標上的方塊
   */
  block(x: number, y: number, z: number): Blocks | null {
    return this._pg[x]?.[y]?.[z] ?? null;
  }

  /**
   * 不使用此引擎時必須呼叫此函式
   */
  destroy(): void {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = undefined;
    }
  }


  private _interval: NodeJS.Timeout | undefined;

  /**
   * 開始模擬遊戲
   */
  startTicking(): void {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = undefined;
    }

    this._interval = setInterval(() => {
      const nextQueue: EngineTask[] = [];

      while (this.taskQueue.length) {
        const task = this.taskQueue.shift();
        if (!task) break;

        const [taskName, params, tickAfter] = task;

        if (tickAfter) {
          task[2]--;
          nextQueue.push(task);
          continue;
        }

        switch (taskName) {
          case 'leftClick':
            this._leftClick(...params);
            break;

          case 'rightClick':
            this._rightClick(...params);
            break;

          case 'torchUpdate':
            this._torchUpdate(...params);
            break;

          case 'repeaterUpdate':
            this._repeaterUpdate(...params);
            break;

          case 'comparatorUpdate':
            this._comparatorUpdate(...params);
            break;

          case 'lampUnlit':
            this._lampUnlit(...params);
            break;

          default: break;
        }
      }

      this.taskQueue.push(...nextQueue);

      this.needRender = true;

      this.tick++;
      if (this.tick % 24000 === 0) {
        this.day++;
      }
    }, 50);
  }

  /**
   * 破壞指定座標上的方塊
   */
  public _leftClick(x: number, y: number, z: number): Blocks | null {
    const block = this.block(x, y, z);
    if (!block?.breakable) return null;

    this._pg[x][y][z] = new AirBlock({ x, y, z, engine: this });
    block.sendPPUpdate();
    return block;
  }

  /**
   * 對指定方塊的指定面上按下使用鍵
   * @param shiftDown 
   * @param normDir 指定面的法向量
   * @param facing 與觀察視角最接近的軸向量方向
   * @param type 在不觸發互動時所放下的方塊
   */
  private _rightClick(
    x: number, y: number, z: number, shiftDown: boolean, normDir: Vector3, facing: FourFacings, type: BlockType
  ): void {
    let block = this.block(x, y, z);
    if (!block) return;

    // 如果指向的方塊可以互動，就互動
    if (!shiftDown && 'interact' in block) {
      block.interact();
      return;
    }

    // 其他情形則直接把方塊放在指定位置上
    x += normDir[0];
    y += normDir[1];
    z += normDir[2];
    block = this.block(x, y, z);

    // 不能超出範圍，且原位置必須為空
    if (!block || block.type !== BlockType.AirBlock) return;

    const face =
      normDir[0] ? (normDir[0] === 1 ? 'east' : 'west') :
      normDir[1] ? (normDir[1] === 1 ? 'up' : 'down') :
      (normDir[2] === 1 ? 'south' : 'north');
    const newBlock = NewBlock(type, { x, y, z, engine: this, normDir: face, facingDir: facing });

    if (newBlock.needBottomSupport && !this.block(x, y - 1, z)?.upperSupport) return;

    this._pg[x][y][z] = newBlock;
    this._pg[x][y][z].sendPPUpdate();
  }

  /**
   * 更新指定位置上的紅石火把的明暗
   * @param lit 新的明暗狀態
   * @private
   */
  private _torchUpdate(x: number, y: number, z: number, lit: boolean): void {
    const block = this.block(x, y, z);
    if (block?.type !== BlockType.RedstoneTorch) return;

    block.torchUpdate(lit);
  }

  /**
   * 更新指定位置上的紅石中繼器的觸發狀態
   * @param powered 新的觸發狀態
   * @private
   */
  private _repeaterUpdate(x: number, y: number, z: number, powered: boolean): void {
    const block = this.block(x, y, z);
    if (block?.type !== BlockType.RedstoneRepeater) return;

    block.repeaterUpdate(powered);
  }

  /**
   * 更新指定位置上的紅石比較器的觸發強度
   * @param power 新的觸發強度
   * @private
   */
  private _comparatorUpdate(x: number, y: number, z: number, power: number): void {
    const block = this.block(x, y, z);
    if (block?.type !== BlockType.RedstoneComparator) return;

    block.comparatorUpdate(power);
  }

  /**
   * 關閉指定位置的紅石燈
   */
  private _lampUnlit(x: number, y: number, z: number): void {
    const block = this.block(x, y, z);
    if (block?.type !== BlockType.RedstoneLamp) return;

    block.lampUnlit();
  }
}

export default Engine;