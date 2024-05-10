import type Controller from "../controller/Controller";
import type { Block } from "../model";
import type Engine from "../model/Engine";
import type { Vector3, Vector4, Vector6 } from "../model/types";
import { BlockType } from "../model/types";
import { Maps } from "../model/utils";
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
  }

  startRendering(func?: () => any): void {
    const draw = async () => {
      if (this.needRender) {
        const success = this.programs.draw();
        if (success) {
          this.resetNeedRender();
        }
      }

      func?.();

      if (this.controller.alive) {
        requestAnimationFrame(draw);
      }
    };

    requestAnimationFrame(draw);
  }

  private lookAtX: number = 0;
  private lookAtY: number = 0;
  setLookAt(canvasX: number, canvasY: number): void {
    this.lookAtX = canvasX;
    this.lookAtY = canvasY;
  }

  private get eyeDir(): Vector4 {
    const screenX = (this.lookAtX / this.canvasW - 0.5) * 2 * this.scaleX;
    const screenY = (0.5 - this.lookAtY / this.canvasH) * 2 * this.scaleY;
    return Matrix4.MultiplyVec(this.programs.mvInv, [screenX, screenY, -1, 0]);
  }

  getTarget(): Vector6 | null {
    const xyz = this.controller.player.xyz;
    const eyeDir = this.eyeDir;

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

  public shouldRender(block: Block, face: BlockModelFace) {
    if (!face.cullface) return true;

    const [x, y, z] = Maps.P6DMap[face.cullface];
    const neighbor = this.engine.block(block.x + x, block.y + y, block.z + z);
    if (!neighbor || neighbor.type === BlockType.AirBlock) return true;

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

  private get needRender() {
    return this.controller.needRender || this.engine.needRender;
  }

  private resetNeedRender() {
    this.controller.needRender = false;
    this.engine.needRender = false;
  }
}
