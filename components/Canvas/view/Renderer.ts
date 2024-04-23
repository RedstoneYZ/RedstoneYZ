import Controller from "../controller/Controller";
import { Block } from "../model";
import Engine from "../model/Engine";
import { BlockType, SixSides, Vector3, Vector4, Vector6 } from "../model/types";
import { Maps } from "../model/utils";
import ModelHandler from "./ModelManager";
import AtlasMap from "@/public/static/images/atlas/map.json";
const { factor, offsets } = AtlasMap;

class Renderer {
  public controller: Controller;
  public engine: Engine;
  public dimensions: Vector3;
  public canvas: HTMLCanvasElement;

  private WIDTH: number;
  private HEIGHT: number;

  private ready: boolean;

  private indices: Uint16Array;

  private models: ModelHandler;
  private gl: WebGL2RenderingContext;
  private uMatWorldLoc: WebGLUniformLocation;

  private mainProgram: WebGLProgram;
  private mainVao: WebGLVertexArrayObject;
  private mainAbo: WebGLBuffer;
  private spriteTex:  WebGLTexture;

  constructor(controller: Controller, canvas: HTMLCanvasElement, dimensions: Vector3) {
    this.controller = controller;
    this.canvas     = canvas;
    this.dimensions = dimensions;
    this.engine     = controller.engine;

    this.WIDTH      = canvas.width;
    this.HEIGHT     = canvas.height;

    this.indices = new Uint16Array(Array.from(
      { length: 4096 }, 
      (_, i) => {
        i <<= 2;
        return [i, i + 1, i + 2, i + 3, 65535];
      }
    ).flat());

    this.models = new ModelHandler();

    this.ready = false;
    this.initGL();
  }

  startRendering(func?: () => any): void {
    const gl = this.gl;

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(1, 0.96, 0.66, 1);

    const draw = async () => {
      if (this.needRender) {
        gl.useProgram(this.mainProgram);
        gl.bindVertexArray(this.mainVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.mainAbo);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.spriteTex);

        gl.uniformMatrix4fv(this.uMatWorldLoc, false, this.worldMat);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const data = this.getBlockVertices();
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLE_FAN, data.length / 44 * 5, gl.UNSIGNED_SHORT, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
        gl.useProgram(null)

        this.resetNeedRender();
      }

      func?.();

      if (this.controller.alive) {
        requestAnimationFrame(draw);
      }
    }

    requestAnimationFrame(draw);
  }

  getTarget(canvasX: number, canvasY: number): Vector6 | null {
    const xyz = this.controller.player.xyz;
    const eyeDir = transform(Array.from(this.worldMatInv), [(canvasX / this.WIDTH - 0.5) * 2, (0.5 - canvasY / this.HEIGHT) * 2, -1, 0]);

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
    console.log([...target.block, ...target.normal]);
    return [...target.block, ...target.normal] as Vector6;
  }

  private async initGL() {
    const gl = this.canvas.getContext('webgl2', { alpha: false });
    if (!gl) {
      throw new Error('Your browser does not support webgl2 canvas.');
    }
    this.gl = gl;

    this.mainProgram = this.createProgram(this.mainVsSrc, this.mainFsSrc);
    this.mainVao = this.createMainVao();
    this.spriteTex = await this.createSpriteTexture();

    const uMatProjLoc  = gl.getUniformLocation(this.mainProgram, 'mProj');
    const uMatWorldLoc = gl.getUniformLocation(this.mainProgram, 'mWorld');
    if (!uMatWorldLoc) {
      throw new Error("Failed to get uniform location.");
    }
    this.uMatWorldLoc = uMatWorldLoc;

    const uMainSamplerLoc = gl.getUniformLocation(this.mainProgram, 'sampler');

    gl.useProgram(this.mainProgram);
    gl.uniformMatrix4fv(uMatProjLoc, false, this.projMat);
    gl.uniform1i(uMainSamplerLoc, 0);
    gl.useProgram(null);

    this.ready = true;
  }

  private createMainVao(): WebGLVertexArrayObject {
    const gl = this.gl;
    const vao = gl.createVertexArray();
    if (!vao) {
      throw new Error("Failed to create main vertex array object");
    }

    gl.bindVertexArray(vao);

    const buffer = gl.createBuffer();
    if (!buffer) {
      throw new Error("Failed to create main array buffer object");
    }
    this.mainAbo = buffer;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.mainAbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0]), gl.STATIC_DRAW);

    // TODO: maybe change normal and texcoords to half float
    // COMMENT: wait for https://github.com/tc39/proposal-float16array
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 44, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 44, 12);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 44, 24);
    gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 44, 32);

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.enableVertexAttribArray(3);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    return vao;
  }

  private createProgram(vss: string, fss: string): WebGLProgram {
    const gl = this.gl;
    const program = gl.createProgram();
    if (!program) {
      throw new Error('Failed to create program.');
    }

    const vs = this.createShader(gl.VERTEX_SHADER, vss);
    const fs = this.createShader(gl.FRAGMENT_SHADER, fss);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Program Link Error\n' + gl.getProgramInfoLog(program)?.toString());
    }

    // TODO: Don't validate at build
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
      throw new Error('Program Validate Error\n' + gl.getProgramInfoLog(program)?.toString());
    }

    return program;
  }

  private createShader(type: number, src: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error('Failed to create shader.');
    }

    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error('Shader Compilation Error\n' + gl.getShaderInfoLog(shader)?.toString());
    }

    return shader;
  }

  private async createSpriteTexture(): Promise<WebGLTexture> {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error("Failed to create main texture.");
    }

    const atlas = await new Promise<HTMLImageElement>(res => {
      const image = new Image();
      image.onload = () => res(image);
      image.src = "/static/images/atlas/file.png";
    });

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    gl.bindTexture(gl.TEXTURE_2D, null);
  
    return texture;
  }

  private getBlockVertices(): Float32Array {
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
              if (!this.shouldRender(block, face.cullface)) return;
              if (!(face.texture in offsets)) {
                throw new Error(`Texture ${face.texture} does not exist in texture atlas.`);
              }

              const { corners: c, texCoord: t, normal: n } = face;
              const offset = offsets[face.texture as keyof typeof offsets];

              for (let l = 0; l < 4; ++l) {
                vertices.push(
                  c[l][0] + x, c[l][1] + y, c[l][2] + z, 
                  n[0], n[1], n[2], 
                  t[l][0] * factor[0] + offset[0], t[l][1] * factor[1] + offset[1], 
                  ...color
                );
              }
            });
          });
        }
      }
    }

    return new Float32Array(vertices);
  }

  // TODO: rewrite to match cullface in data
  private shouldRender(block: Block, dir: SixSides) {
    if (block.type !== BlockType.IronBlock && block.type !== BlockType.Glass) return true;

    const [x, y, z] = Maps.P6DMap[dir];
    const adjacentBlock = this.engine.block(block.x + x, block.y + y, block.z + z);
    if (!adjacentBlock) return true;

    if (block.type === BlockType.Glass) return !adjacentBlock.fullBlock;
    return !adjacentBlock.fullBlock || adjacentBlock.type === BlockType.AirBlock || adjacentBlock.type === BlockType.Glass;
  }

  private get needRender() {
    return this.ready && (this.controller.needRender || this.engine.needRender);
  }

  private resetNeedRender() {
    this.controller.needRender = false;
    this.engine.needRender = false;
  }

  private mainVsSrc = `#version 300 es
    layout(location = 0) in vec3 a_position;
    layout(location = 1) in mediump vec3 a_normal;
    layout(location = 2) in mediump vec2 a_texcoord;
    layout(location = 3) in mediump vec3 a_colormask;

    uniform mat4 mWorld;
    uniform mat4 mProj;

    out mediump vec3 v_colormask;
    out mediump vec2 v_texcoord;
    flat out mediump vec3 v_normal;

    void main() {
      v_colormask = a_colormask;
      v_texcoord  = a_texcoord;
      v_normal    = (mWorld * vec4(a_normal, 0.0)).rgb;
      gl_Position = mProj * mWorld * vec4(a_position, 1.0);
    }
  `;

  private mainFsSrc = `#version 300 es
    precision mediump float;

    in mediump vec3 v_colormask;
    in mediump vec2 v_texcoord;
    flat in mediump vec3 v_normal;

    const vec3 ambientIntensity = vec3(0.4, 0.4, 0.7);
    const vec3 lightColor = vec3(0.8, 0.8, 0.4);
    const vec3 lightDirection = normalize(vec3(1.0, 2.0, 3.0));
    uniform sampler2D sampler;

    out vec4 fragColor;

    void main() {
      vec4 texel = texture(sampler, v_texcoord);
      vec3 lightIntensity = ambientIntensity + lightColor * max(dot(normalize(v_normal), lightDirection), 0.0);

      fragColor = vec4(texel.rgb * v_colormask * lightIntensity, texel.a);
      if (fragColor.a < 0.1) discard;
    }
  `;

  private get worldMat(): Float32Array {
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

  private projMat = new Float32Array([
    1, 0,      0,  0, 
    0, 1,      0,  0, 
    0, 0, -1.002, -1, 
    0, 0,   -0.2,  0
  ]);
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