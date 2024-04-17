import Controller from "../controller/Controller";
import { Block } from "../model";
import Engine from "../model/Engine";
import { BlockType, SixSides, Vector3, Vector6 } from "../model/types";
import { Maps } from "../model/utils";
import ModelHandler from "./ModelManager";

const F32_SIZE = Float32Array.BYTES_PER_ELEMENT;

class Renderer {
  public controller: Controller;
  public engine: Engine;
  public canvas: HTMLCanvasElement;

  public dimensions: Vector3;
  public images: Map<string, HTMLImageElement>;
  public indices: Uint16Array;
  
  private models: ModelHandler;
  private gl: WebGL2RenderingContext;
  private mainProgram: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private uMatWorldLoc: WebGLUniformLocation;

  constructor(controller: Controller, canvas: HTMLCanvasElement, dimensions: Vector3) {
    this.controller = controller;
    this.canvas     = canvas;
    this.dimensions = dimensions;
    this.engine     = controller.engine;

    this.images = new Map();
    ['iron_block', 'comparator', 'comparator_on', 'cobblestone', 'lever', 'redstone_dust_dot', 'redstone_dust_line0', 'redstone_dust_line1', 'redstone_dust_overlay', 'redstone_lamp', 'redstone_lamp_on', 'glass', 'repeater', 'smooth_stone', 'repeater_on', 'redstone_torch', 'redstone_torch_off', 'bedrock', 'target_top', 'target_side'].forEach(src => {
      const image = new Image();
      image.src = `/static/images/textures/${src}.png`;
      this.images.set(src, image);
    });

    this.indices = new Uint16Array(Array.from(
      { length: 4096 }, 
      (_, i) => {
        i <<= 2;
        return [i, i + 1, i + 2, i + 3, 65535];
      }
    ).flat());

    this.models = new ModelHandler();

    this.initGL();
  }

  startRendering(): void {
    const gl = this.gl;

    const draw = async () => {
      if (this.needRender) {
        gl.useProgram(this.mainProgram);

        gl.uniformMatrix4fv(this.uMatWorldLoc, false, this.worldMat);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindVertexArray(this.vao);

        const data = await this.getBlockVertices();
        for (const [image, vertices] of data) {
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

          const img = this.images.get(image);
          if (img) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.drawElements(gl.TRIANGLE_FAN, vertices.length / 44 * 5, gl.UNSIGNED_SHORT, 0);
          }
        }

        gl.bindVertexArray(null);
        this.resetNeedRender();
      }

      if (this.controller.alive) {
        requestAnimationFrame(draw);
      }
    }

    requestAnimationFrame(draw);
  }

  getTarget(canvasX: number, canvasY: number): Vector6 | null {
    const repCode = new Uint8Array(4);
    this.gl.readPixels(canvasX, 500-canvasY, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, repCode);

    if (!repCode[0] && !repCode[1] && !repCode[2]) return null;

    repCode[0] -= 128;
    repCode[1] -= 128;
    repCode[2] -= 128;

    return [
      repCode[0] >> 3, 
      repCode[1] >> 3, 
      repCode[2] >> 3, 
      ((repCode[0] & 7) >> 1) - 1, 
      ((repCode[1] & 7) >> 1) - 1, 
      ((repCode[2] & 7) >> 1) - 1
    ];
  }

  private initGL(): WebGL2RenderingContext {
    const gl = this.canvas.getContext('webgl2', { alpha: false });
    if (!gl) {
      throw new Error('Your browser does not support webgl2 canvas.');
    }

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(1, 0.96, 0.66, 1);

    const program = this.createProgram(gl, this.mainVsSrc, this.mainFsSrc);
    gl.useProgram(program);

    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.activeTexture(gl.TEXTURE0);

    const uMatViewLoc  = gl.getUniformLocation(program, 'mView');
    const uMatProjLoc  = gl.getUniformLocation(program, 'mProj');
    const uMatWorldLoc = gl.getUniformLocation(program, 'mWorld');
    if (!uMatWorldLoc) {
      throw new Error("Failed to get uniform location.");
    }

    gl.uniformMatrix4fv(uMatViewLoc, false, this.viewMat);
    gl.uniformMatrix4fv(uMatProjLoc, false, this.projMat);

    this.gl = gl;
    this.mainProgram = program;
    this.vao = this.initMainVao(gl);
    this.uMatWorldLoc = uMatWorldLoc;

    return gl;
  }

  private initMainVao(gl: WebGL2RenderingContext): WebGLVertexArrayObject {
    const vao = gl.createVertexArray();
    if (!vao) {
      throw new Error("Failed to create vertex array object");
    }

    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(), gl.STATIC_DRAW);

    // TODO: maybe change normal and texcoords to half float
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 11 * F32_SIZE, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 11 * F32_SIZE, 3 * F32_SIZE);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 11 * F32_SIZE, 6 * F32_SIZE);
    gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 11 * F32_SIZE, 8 * F32_SIZE);

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.enableVertexAttribArray(3);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    return vao;
  }

  private createProgram(gl: WebGL2RenderingContext, vss: string, fss: string): WebGLProgram {
    const program = gl.createProgram();
    if (!program) {
      throw new Error('Failed to create program.');
    }

    const vs = this.createShader(gl, gl.VERTEX_SHADER, vss);
    const fs = this.createShader(gl, gl.FRAGMENT_SHADER, fss);
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

  private createShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
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

  private async getBlockVertices(): Promise<Map<string, number[]>> {
    // TODO: only update block changes
    const map = new Map<string, number[]>();
    for (let i = 0; i < this.dimensions[0]; i++) {
      for (let j = 0; j < this.dimensions[1]; j++) {
        for (let k = 0; k < this.dimensions[2]; k++) {
          const block = this.engine.block(i, j, k);
          if (!block || block.type === BlockType.AirBlock) continue;

          const x = i - this.dimensions[0] / 2;
          const y = j - this.dimensions[1] / 2;
          const z = k - this.dimensions[2] / 2;
          const color = 'color' in block ? block.color.map(a => a / 255) : [1, 1, 1];

          const models = await this.models.get(block.type, block.states);
          models.forEach(model => {
            model.faces.forEach(face => {
              if (this.shouldRender(block, face.cullface)) {
                let storage = map.get(face.texture);
                if (!storage) {
                  storage = [];
                  map.set(face.texture, storage);
                }
  
                for (let i = 0; i < 4; ++i) {
                  const { corners: c, texCords: t, normal: n } = face;
                  storage.push(
                    c[i][0] + x, c[i][1] + y, c[i][2] + z, 
                    n[0], n[1], n[2], 
                    t[i][0], t[i][1], 
                    ...color
                  );
                }
              }
            });
          })
        }
      }  
    }
    return map;
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
    return this.controller.needRender || this.engine.needRender;
  }

  private resetNeedRender() {
    this.controller.needRender = false;
    this.engine.needRender = false;
  }

  private mainVsSrc = `#version 300 es
    precision mediump float;
    
    layout(location = 0) in vec3 a_position;
    layout(location = 1) in vec3 a_normal;
    layout(location = 2) in vec2 a_texcoord;
    layout(location = 3) in vec3 a_colormask;
    uniform mat4 mWorld;
    uniform mat4 mView;
    uniform mat4 mProj;
    out vec2 fragTexCoord;
    out vec3 fragNormal;
    out vec3 fragColorMask;

    void main() {
      fragTexCoord = a_texcoord;
      fragColorMask = a_colormask;
      fragNormal = (mWorld * vec4(a_normal, 0.0)).xyz;
      gl_Position = mProj * mView * mWorld * vec4(a_position, 1.0);
    }
  `;

  private mainFsSrc = `#version 300 es
    precision mediump float;

    layout(location = 0) out vec4 fragColor;

    const vec3 ambientIntensity = vec3(0.4, 0.4, 0.7);
    const vec3 lightColor = vec3(0.8, 0.8, 0.4);
    const vec3 lightDirection = normalize(vec3(1.0, 2.0, 3.0));

    in vec2 fragTexCoord;
    in vec3 fragNormal;
    in vec3 fragColorMask;
    uniform sampler2D sampler;

    void main() {
      vec4 texel = texture(sampler, fragTexCoord);
      vec3 lightIntensity = ambientIntensity + lightColor * max(dot(normalize(fragNormal), lightDirection), 0.0);

      fragColor = vec4(texel.rgb * fragColorMask * lightIntensity, texel.a);
      if (fragColor.a < 0.1) discard;
    }
  `;

  private get worldMat(): Float32Array {
    const { yaw, pitch } = this.controller.player.facing;
    const c1 = Math.cos(yaw), s1 = Math.sin(yaw);
    const c2 = Math.cos(pitch), s2 = Math.sin(pitch);

    return new Float32Array([
       c1,  s1 * s2,  c2 * s1, 0, 
        0,       c2,      -s2, 0, 
      -s1,  c1 * s2,  c1 * c2, 0, 
        0,        0,        0, 1
    ]);
  }

  private _viewMat: Float32Array | null = null;
  private get viewMat() {
    if (this._viewMat) return this._viewMat;

    const a = 2.5 / Math.sqrt(Math.max(...this.dimensions));
    this._viewMat = new Float32Array([
      a, 0, 0, 0, 
      0, a, 0, 0, 
      0, 0, a, 0, 
      0, 0, -15, 1
    ]);
    return this._viewMat;
  }

  private projMat = new Float32Array([
    2.414,     0,    0,  0, 
        0, 2.414,    0,  0, 
        0,     0,   -1, -1, 
        0,     0, -0.2,  0
  ]);
}

export default Renderer;