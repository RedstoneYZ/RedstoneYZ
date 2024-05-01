import Controller from "../controller/Controller";
import { Block } from "../model";
import Engine from "../model/Engine";
import { BlockType, Vector3, Vector4, Vector6 } from "../model/types";
import { Maps } from "../model/utils";
import ModelHandler from "./ModelManager";
// import TestProgram from "./Programs/TestProgram";
import EnvironmentProgram from "./Programs/EnvironmentProgram";
import Program from "./Programs/Program";
import TextureManager from "./TextureManager";
import { BlockModelFace } from "./types";
import LineProgram from "./Programs/LineProgram";
import LightProgram from "./Programs/LightProgram";
import MainProgram from "./Programs/MainProgram";
import Matrix4 from "./utils/Matrix4";

export default class Renderer {
  public controller: Controller;
  public engine: Engine;
  public dimensions: Vector3;
  public canvas: HTMLCanvasElement;

  public textures: TextureManager;
  public models: ModelHandler;

  public WIDTH: number;
  public HEIGHT: number;
  public X_SCALE: number;
  public Y_SCALE: number;

  private gl: WebGL2RenderingContext;

  public programs: Program[];

  constructor(controller: Controller, canvas: HTMLCanvasElement, dimensions: Vector3) {
    this.controller = controller;
    this.canvas     = canvas;
    this.dimensions = dimensions;
    this.engine     = controller.engine;

    this.textures   = new TextureManager();
    this.models     = new ModelHandler();

    this.WIDTH   = canvas.width;
    this.HEIGHT  = canvas.height;
    this.X_SCALE = this.WIDTH > this.HEIGHT ? this.WIDTH / this.HEIGHT : 1;
    this.Y_SCALE = this.WIDTH > this.HEIGHT ? 1 : this.HEIGHT / this.WIDTH;

    this.gl = this.initGL();

    this.programs = [
      new LightProgram(this, this.gl), 
      // new TestProgram(this, this.gl), 
      new MainProgram(this, this.gl), 
      new EnvironmentProgram(this, this.gl), 
      new LineProgram(this, this.gl), 
    ];
  }

  startRendering(func?: () => any): void {
    const gl = this.gl;

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(0.5, 0.63, 1, 1);
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(2, 20);

    const draw = async () => {
      if (this.needRender) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let allSuccess = true;
        for (const program of this.programs) {
          const success = program.draw();
          allSuccess &&= success;
        }

        if (allSuccess) {
          this.resetNeedRender();
        }
      }

      func?.();

      if (this.controller.alive) {
        requestAnimationFrame(draw);
      }
    }

    requestAnimationFrame(draw);
  }

  private lookAtX: number = 0;
  private lookAtY: number = 0;
  setLookAt(canvasX: number, canvasY: number): void {
    this.lookAtX = canvasX;
    this.lookAtY = canvasY;
  }

  private get eyeDir(): Vector4 {
    const screenX = (this.lookAtX / this.WIDTH - 0.5) * 2 * this.X_SCALE;
    const screenY = (0.5 - this.lookAtY / this.HEIGHT) * 2 * this.Y_SCALE;
    return Matrix4.MultiplyVec(this.mvInv, [screenX, screenY, -1, 0]);
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
          models.forEach(model => {
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

  // TODO: rewrite to match cullface in data
  public shouldRender(block: Block, face: BlockModelFace) {
    if (!face.cullface) return true;

    const [x, y, z] = Maps.P6DMap[face.cullface];
    const neighbor = this.engine.block(block.x + x, block.y + y, block.z + z);
    if (!neighbor || neighbor.type === BlockType.AirBlock) return true;
  
    const map = {
      south: [0, 1], north: [0, 1], 
      east: [1, 2], west: [1, 2], 
      up: [2, 0], down: [2, 0], 
    } as const;

    const reverse = Maps.ReverseDir[face.cullface];

    const neighborModels = this.models.get(neighbor.type, neighbor.states);
    const [i1, i2] = map[face.cullface];

    const min1 = Math.min(...face.corners.map(a => a[i1]));
    const max1 = Math.max(...face.corners.map(a => a[i1]));
    const min2 = Math.min(...face.corners.map(a => a[i2]));
    const max2 = Math.max(...face.corners.map(a => a[i2]));

    for (const model of neighborModels) {
      for (const neighborFace of model.faces) {
        if (neighborFace.cullface !== reverse) continue;
        if (neighborFace.corners.every(c => (c[i1] <= min1 || c[i1] >= max1) && (c[i2] <= min2 || c[i2] >= max2))) return false;
      }
    }

    return true;
  }

  public get sunAngle(): number {
    const tick = this.engine.tick % 24000;
    return tick * Math.PI / 12000;
  }

  public get seasonAngle(): number {
    const tick = this.engine.tick % (24000 * 96);
    return tick * Math.PI / (24000 * 48);
  }

  public get mvp(): Float32Array {
    const { xyz: { x, y, z }, facing: { yaw, pitch } } = this.controller.player;

    return Matrix4.Multiply(
      Matrix4.Translate(-x, -y, -z), 
      Matrix4.RotateY(yaw - Math.PI), 
      Matrix4.RotateX(-pitch), 
      Matrix4.Perspective(0.2 * this.X_SCALE, 0.2 * this.Y_SCALE, 0.1, 100)
    );
  }

  public get mlp(): Float32Array {
    const theta = this.sunAngle;
    const phi   = this.seasonAngle;
    const x = this.X_SCALE;
    const y = this.Y_SCALE;

    return Matrix4.Multiply(
      Matrix4.RotateY(-Math.PI/2), 
      Matrix4.RotateZ(-25.04 * Math.PI / 180), 
      Matrix4.RotateX(theta), 
      Matrix4.RotateY(-23.4 * Math.sin(phi) * Math.PI / 180), 
      Matrix4.Orthographic(-7*x, 7*x, -7*y, 7*y, -10, 10)
    );
  }

  public indices = new Uint16Array(Array.from(
    { length: 4096 }, 
    (_, i) => {
      i <<= 2;
      return [i, i + 1, i + 2, i + 3, 65535];
    }
  ).flat());

  private get mvInv(): Float32Array {
    const { xyz: { x, y, z }, facing: { yaw, pitch } } = this.controller.player;
    return Matrix4.Multiply(
      Matrix4.RotateX(pitch), 
      Matrix4.RotateY(Math.PI - yaw), 
      Matrix4.Translate(x, y, z), 
    );
  }

  private initGL(): WebGL2RenderingContext {
    const gl = this.canvas.getContext('webgl2', { alpha: false });
    if (!gl) {
      throw new Error('Your browser does not support webgl2 canvas.');
    }
    return gl;
  }

  private get needRender() {
    return this.controller.needRender || this.engine.needRender;
  }

  private resetNeedRender() {
    this.controller.needRender = false;
    this.engine.needRender = false;
  }
}
