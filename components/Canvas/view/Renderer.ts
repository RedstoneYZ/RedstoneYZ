import type Controller from "../controller/Controller";
import type { Block } from "../model";
import type Engine from "../model/Engine";
import type { BlockInternal, BlockState, Vector3, Vector6 } from "../model/types";
import { BlockType } from "../model/types";
import { Maps, strictEqual } from "../model/utils";
import ModelHandler from "./ModelManager";
import TextureManager from "./TextureManager";
import type { BlockModelFace } from "./types";
import Matrix4 from "./utils/Matrix4";
import ProgramManager from "./ProgramManager";

export default class Renderer {
  public controller: Controller;
  public engine: Engine;
  public dimensions: Vector3;

  public models: ModelHandler;
  public programs: ProgramManager;
  public textures: TextureManager;

  public canvasW: number;
  public canvasH: number;
  public scaleX: number;
  public scaleY: number;

  public mspf: number;
  public maxMspf: number;

  public pg: RenderBlock[][][];

  constructor(controller: Controller, canvas: HTMLCanvasElement, dimensions: Vector3) {
    this.controller = controller;
    this.dimensions = dimensions;
    this.engine = controller.engine;

    this.canvasW = canvas.width;
    this.canvasH = canvas.height;
    this.scaleX = this.canvasW > this.canvasH ? this.canvasW / this.canvasH : 1;
    this.scaleY = this.canvasW > this.canvasH ? 1 : this.canvasH / this.canvasW;

    this.models = new ModelHandler();
    this.programs = new ProgramManager(this, canvas);
    this.textures = new TextureManager();

    this.mspf = 0;
    this.maxMspf = 0;

    this.pg = this.generatePlayground();
  }

  private lastFrameTime: number = window.performance.now();
  startRendering(func?: () => any): void {
    const draw = async () => {
      const time = window.performance.now();

      if (this.needRender) {
        const success = this.programs.draw();
        if (success) {
          this.resetNeedRender();
        }

        this.mspf = 0.25 * (time - this.lastFrameTime) + 0.75 * this.mspf;
        this.maxMspf = 0.25 * (window.performance.now() - time) + 0.75 * this.maxMspf;
        this.lastFrameTime = time;
      }

      func?.();

      if (this.controller.alive) {
        requestAnimationFrame(draw);
      }
    };

    requestAnimationFrame(draw);
  }

  updatePlayground() {
    const needUpdate: boolean[][][] = Array.from({ length: this.engine.xLen }, () =>
      Array.from({ length: this.engine.yLen }, () =>
        Array.from({ length: this.engine.zLen }, () => false),
      ),
    );

    for (let x = 0; x < this.engine.xLen; x++) {
      for (let y = 0; y < this.engine.yLen; y++) {
        for (let z = 0; z < this.engine.zLen; z++) {
          const block = this.engine.block(x, y, z)!;
          const { type, internal, states } = this.pg[x][y][z];

          const updated =
            type !== block.type ||
            !strictEqual(internal, block.internal) ||
            !strictEqual(states, block.states);

          needUpdate[x][y][z] ||= updated;
          if (!updated) continue;

          if (needUpdate[x + 1]?.[y]?.[z] !== undefined) needUpdate[x + 1][y][z] = true;
          if (needUpdate[x - 1]?.[y]?.[z] !== undefined) needUpdate[x - 1][y][z] = true;
          if (needUpdate[x]?.[y + 1]?.[z] !== undefined) needUpdate[x][y + 1][z] = true;
          if (needUpdate[x]?.[y - 1]?.[z] !== undefined) needUpdate[x][y - 1][z] = true;
          if (needUpdate[x]?.[y]?.[z + 1] !== undefined) needUpdate[x][y][z + 1] = true;
          if (needUpdate[x]?.[y]?.[z - 1] !== undefined) needUpdate[x][y][z - 1] = true;
        }
      }
    }

    for (let x = 0; x < this.engine.xLen; x++) {
      for (let y = 0; y < this.engine.yLen; y++) {
        for (let z = 0; z < this.engine.zLen; z++) {
          if (!needUpdate[x][y][z]) continue;

          const block = this.engine.block(x, y, z)!;
          this.pg[x][y][z] = {
            type: block.type,
            internal: structuredClone(block.internal),
            states: structuredClone(block.states),
            exposedFaces: [],
          };

          if (block.type === BlockType.AirBlock) continue;
          const models = this.models.get(block.type, block.states);

          models.forEach((model) => {
            model.faces.forEach((face) => {
              if (this.isExposed(block, face)) {
                this.pg[x][y][z].exposedFaces.push(face);
              }
            });
          });
        }
      }
    }
  }

  getTarget(): Vector6 | null {
    const xyz = this.controller.player.xyz;
    const eyeDir = Matrix4.MultiplyVec(this.programs.mvInv, [0, 0, -1, 0]);

    const target = { block: [0, 0, 0], normal: [0, 0, 0], d: Infinity };
    for (let x = 0; x < this.dimensions[0]; x++) {
      for (let y = 0; y < this.dimensions[1]; y++) {
        for (let z = 0; z < this.dimensions[2]; z++) {
          const block = this.engine.block(x, y, z);
          if (!block || block.type === BlockType.AirBlock) continue;
          const models = this.models.get(block.type, block.states);
          models.forEach((model) => {
            model.outline.forEach(({ from, to }) => {
              const x1 = x + from[0];
              const y1 = y + from[1];
              const z1 = z + from[2];
              const x2 = x + to[0];
              const y2 = y + to[1];
              const z2 = z + to[2];

              let d = (x1 - xyz.x) / eyeDir[0];
              if (d > 0) {
                const dy = xyz.y + eyeDir[1] * d;
                const dz = xyz.z + eyeDir[2] * d;
                if (y1 <= dy && dy <= y2 && z1 <= dz && dz <= z2 && d < target.d) {
                  target.block = [x, y, z];
                  target.normal = [-1, 0, 0];
                  target.d = d;
                }
              }
              d = (x2 - xyz.x) / eyeDir[0];
              if (d > 0) {
                const dy = xyz.y + eyeDir[1] * d;
                const dz = xyz.z + eyeDir[2] * d;
                if (y1 <= dy && dy <= y2 && z1 <= dz && dz <= z2 && d < target.d) {
                  target.block = [x, y, z];
                  target.normal = [1, 0, 0];
                  target.d = d;
                }
              }
              d = (y1 - xyz.y) / eyeDir[1];
              if (d > 0) {
                const dx = xyz.x + eyeDir[0] * d;
                const dz = xyz.z + eyeDir[2] * d;
                if (x1 <= dx && dx <= x2 && z1 <= dz && dz <= z2 && d < target.d) {
                  target.block = [x, y, z];
                  target.normal = [0, -1, 0];
                  target.d = d;
                }
              }
              d = (y2 - xyz.y) / eyeDir[1];
              if (d > 0) {
                const dx = xyz.x + eyeDir[0] * d;
                const dz = xyz.z + eyeDir[2] * d;
                if (x1 <= dx && dx <= x2 && z1 <= dz && dz <= z2 && d < target.d) {
                  target.block = [x, y, z];
                  target.normal = [0, 1, 0];
                  target.d = d;
                }
              }
              d = (z1 - xyz.z) / eyeDir[2];
              if (d > 0) {
                const dx = xyz.x + eyeDir[0] * d;
                const dy = xyz.y + eyeDir[1] * d;
                if (x1 <= dx && dx <= x2 && y1 <= dy && dy <= y2 && d < target.d) {
                  target.block = [x, y, z];
                  target.normal = [0, 0, -1];
                  target.d = d;
                }
              }
              d = (z2 - xyz.z) / eyeDir[2];
              if (d > 0) {
                const dx = xyz.x + eyeDir[0] * d;
                const dy = xyz.y + eyeDir[1] * d;
                if (x1 <= dx && dx <= x2 && y1 <= dy && dy <= y2 && d < target.d) {
                  target.block = [x, y, z];
                  target.normal = [0, 0, 1];
                  target.d = d;
                }
              }
            });
          });
        }
      }
    }

    if (target.d === Infinity) return null;
    return [...target.block, ...target.normal] as Vector6;
  }

  private get needRender() {
    return this.controller.needRender || this.engine.needRender;
  }

  private resetNeedRender() {
    this.controller.needRender = false;
    this.engine.needRender = false;
  }

  private isExposed(block: Block, face: BlockModelFace) {
    if (!face.cullface) return true;

    const [x, y, z] = Maps.P6DMap[face.cullface];
    const neighbor = this.engine.block(block.x + x, block.y + y, block.z + z);
    if (!neighbor || neighbor.type === BlockType.AirBlock) return true;
    if (block.type !== BlockType.Glass && neighbor.type === BlockType.Glass) return true;

    const map = {
      south: [0, 1],
      north: [0, 1],
      east: [1, 2],
      west: [1, 2],
      up: [2, 0],
      down: [2, 0],
    } as const;

    const reverse = Maps.ReverseDir[face.cullface];

    const neighborModels = this.models.get(neighbor.type, neighbor.states);
    const [i1, i2] = map[face.cullface];

    const min1 = Math.min(...face.corners.map((a) => a[i1]));
    const max1 = Math.max(...face.corners.map((a) => a[i1]));
    const min2 = Math.min(...face.corners.map((a) => a[i2]));
    const max2 = Math.max(...face.corners.map((a) => a[i2]));

    for (const model of neighborModels) {
      for (const neighborFace of model.faces) {
        if (neighborFace.cullface !== reverse) continue;
        if (
          neighborFace.corners.every(
            (c) => (c[i1] <= min1 || c[i1] >= max1) && (c[i2] <= min2 || c[i2] >= max2),
          )
        )
          return false;
      }
    }

    return true;
  }

  private generatePlayground(): RenderBlock[][][] {
    const pg: RenderBlock[][][] = [];
    for (let x = 0; x < this.engine.xLen; x++) {
      pg.push([]);
      for (let y = 0; y < this.engine.yLen; y++) {
        pg[x].push([]);
        for (let z = 0; z < this.engine.zLen; z++) {
          const block = this.engine.block(x, y, z);
          if (!block || block.type === BlockType.AirBlock) {
            pg[x][y][z] = {
              type: BlockType.AirBlock,
              internal: { power: 0, source: false },
              states: {},
              exposedFaces: [],
            };
            continue;
          }

          pg[x][y][z] = {
            type: block.type,
            internal: structuredClone(block.internal),
            states: structuredClone(block.states),
            exposedFaces: [],
          };

          const models = this.models.get(block.type, block.states);
          models.forEach((model) => {
            model.faces.forEach((face) => {
              if (this.isExposed(block, face)) {
                pg[x][y][z].exposedFaces.push(face);
              }
            });
          });
        }
      }
    }
    return pg;
  }
}

interface RenderBlock {
  type: BlockType;
  internal: BlockInternal;
  states: BlockState;
  exposedFaces: BlockModelFace[];
}
