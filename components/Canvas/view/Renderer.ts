import Controller from "../controller/Controller";
import { Block } from "../model";
import Engine from "../model/Engine";
import { BlockType, Vector3, Vector4, Vector6 } from "../model/types";
import { Maps } from "../model/utils";
import ModelHandler from "./ModelManager";
import MainProgram from "./Programs/MainProgram";
import EnvironmentProgram from "./Programs/EnvironmentProgram";
import Program from "./Programs/Program";
import TextureManager from "./TextureManager";
import { BlockModelFace } from "./types";

class Renderer {
  public controller: Controller;
  public engine: Engine;
  public textures: TextureManager;
  public dimensions: Vector3;
  public canvas: HTMLCanvasElement;

  private WIDTH: number;
  private HEIGHT: number;
  public projMat: Float32Array;

  private models: ModelHandler;
  private gl: WebGL2RenderingContext;

  private programs: Program[];

  constructor(controller: Controller, canvas: HTMLCanvasElement, dimensions: Vector3) {
    this.controller = controller;
    this.canvas     = canvas;
    this.textures   = new TextureManager();
    this.dimensions = dimensions;
    this.engine     = controller.engine;

    this.WIDTH      = canvas.width;
    this.HEIGHT     = canvas.height;

    const x = this.WIDTH > this.HEIGHT ? this.HEIGHT / this.WIDTH : 1;
    const y = this.WIDTH > this.HEIGHT ? 1 : this.WIDTH / this.HEIGHT;
    this.projMat = new Float32Array([
      x, 0,      0,  0, 
      0, y,      0,  0, 
      0, 0, -1.002, -1, 
      0, 0,   -0.2,  0
    ]);

    this.models = new ModelHandler();
    this.gl = this.initGL();

    this.programs = [
      new MainProgram(this, this.gl), 
      new EnvironmentProgram(this, this.gl)
    ];
  }

  startRendering(func?: () => any): void {
    const gl = this.gl;

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(0.5, 0.63, 1, 1);
    
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

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

  private eyeDir(x: number, y: number): Vector4 {
    const fx = this.WIDTH > this.HEIGHT ? this.WIDTH / this.HEIGHT : 1;
    const fy = this.WIDTH > this.HEIGHT ? 1 : this.HEIGHT / this.WIDTH;
    return [(x / this.WIDTH - 0.5) * 2 * fx, (0.5 - y / this.HEIGHT) * 2 * fy, -1, 0]
  }

  getTarget(canvasX: number, canvasY: number): Vector6 | null {
    const xyz = this.controller.player.xyz;
    const eyeDir = transform(Array.from(this.worldMatInv), this.eyeDir(canvasX, canvasY));

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

  private initGL(): WebGL2RenderingContext {
    const gl = this.canvas.getContext('webgl2', { alpha: false });
    if (!gl) {
      throw new Error('Your browser does not support webgl2 canvas.');
    }
    return gl;
  }

  public getBlockVertices(): Float32Array {
    // TODO: only update block changes
    const vertices: number[] = [];
    for (let x = 0; x < this.dimensions[0]; x++) {
      for (let y = 0; y < this.dimensions[1]; y++) {
        for (let z = 0; z < this.dimensions[2]; z++) {
          const block = this.engine.block(x, y, z);
          if (!block || block.type === BlockType.AirBlock) continue;
          const color = 'color' in block ? block.color.map(a => a / 255) : [1, 1, 1];

          const models = this.models.get(block.type, block.states);
          models.forEach(model => {
            model.faces.forEach(face => {
              if (!this.shouldRender(block, face)) return;

              const { corners: c, texCoord: t, normal: n } = face;
              const offset = this.textures.sample(face.texture, this.engine.tick);
              const [ox1, oy1, ox2, oy2, oa, ob] = offset;

              for (let l = 0; l < 4; ++l) {
                const tex1 = t[l][0] + ox1 << 20 | t[l][1] + oy1 << 10 | t[l][0] + ox2;
                const tex2 = t[l][1] + oy2 << 20 | oa << 10 | ob;

                vertices.push(
                  c[l][0] + x, c[l][1] + y, c[l][2] + z, 
                  n[0], n[1], n[2], 
                  tex1, tex2, 
                  ...color
                );
              }
            });
          });
        }
      }
    }

    const asFloat32 = new Float32Array(vertices);
    const asInt32   = new Int32Array(asFloat32.buffer);
    for (let i = 0; i < asFloat32.length; i += 11) {
      asInt32[i + 6] = vertices[i + 6];
      asInt32[i + 7] = vertices[i + 7];
    }

    return asFloat32;
  }

  // TODO: rewrite to match cullface in data
  private shouldRender(block: Block, face: BlockModelFace) {
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

  private get needRender() {
    return this.controller.needRender || this.engine.needRender;
  }

  private resetNeedRender() {
    this.controller.needRender = false;
    this.engine.needRender = false;
  }

  public get worldMat(): Float32Array {
    const { xyz: { x, y, z }, facing: { yaw, pitch } } = this.controller.player;
    const cp = Math.cos(-pitch), sp = Math.sin(-pitch);
    const cy = Math.cos(-yaw), sy = Math.sin(-yaw);

    const cycp = cy * cp;
    const cysp = cy * sp;
    const sycp = sy * cp;
    const sysp = sy * sp;

    return new Float32Array([
      -cy, sysp, -sycp, 0, 
        0,   cp,    sp, 0, 
       sy, cysp, -cycp, 0, 
      x*cy - z*sy, - x*sysp - y*cp - z*cysp, x*sycp - y*sp + z*cycp, 1, 
    ]);
  }

  private get worldMatInv(): Float32Array {
    const { xyz: { x, y, z }, facing: { yaw, pitch } } = this.controller.player;
    const cp = Math.cos(-pitch), sp = Math.sin(-pitch);
    const cy = Math.cos(-yaw), sy = Math.sin(-yaw);

    const cycp = cy * cp;
    const cysp = cy * sp;
    const sycp = sy * cp;
    const sysp = sy * sp;

    return new Float32Array([
        -cy,  0,    sy, 0, 
       sysp, cp,  cysp, 0, 
      -sycp, sp, -cycp, 0, 
      x, y, z, 1, 
    ]);
  }
}

export default Renderer;

function transform(mat: number[], vec: number[]): Vector4 {
  return [
    mat[0]*vec[0] + mat[4]*vec[1] + mat[8]*vec[2] + mat[12]*vec[3], 
    mat[1]*vec[0] + mat[5]*vec[1] + mat[9]*vec[2] + mat[13]*vec[3], 
    mat[2]*vec[0] + mat[6]*vec[1] + mat[10]*vec[2] + mat[14]*vec[3], 
    mat[3]*vec[0] + mat[7]*vec[1] + mat[11]*vec[2] + mat[15]*vec[3]
  ];
}