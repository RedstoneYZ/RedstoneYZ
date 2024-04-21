import Controller from "../controller/Controller";
import { Block } from "../model";
import Engine from "../model/Engine";
import { BlockType, SixSides, Vector3, Vector6 } from "../model/types";
import { Maps } from "../model/utils";
import ModelHandler from "./ModelManager";
import AtlasMap from "@/public/static/images/atlas/map.json";
const { factor, offsets } = AtlasMap;

class Renderer {
  public controller: Controller;
  public engine: Engine;
  public dimensions: Vector3;
  public canvas: HTMLCanvasElement;

  private READ_FORMAT: number;
  private READ_TYPE: number;
  private WIDTH: number;
  private HEIGHT: number;

  private ready: boolean;

  private indices: Uint16Array;

  private models: ModelHandler;
  private gl: WebGL2RenderingContext;
  private uMatWorldLoc: WebGLUniformLocation;

  private mainProgram: WebGLProgram;
  private quadProgram: WebGLProgram;
  private mainVao: WebGLVertexArrayObject;
  private quadVao: WebGLVertexArrayObject;
  private mainAbo: WebGLBuffer;
  private mainFbo: WebGLFramebuffer;
  private spriteTex:  WebGLTexture;
  private screenTex: WebGLTexture;
  private targetTex: WebGLTexture;

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

    const draw = async () => {
      if (this.needRender) {
        gl.useProgram(this.mainProgram);
        gl.bindVertexArray(this.mainVao);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.spriteTex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.mainAbo);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.mainFbo);

        gl.uniformMatrix4fv(this.uMatWorldLoc, false, this.worldMat);

        gl.clearBufferfv(gl.COLOR, 0, new Float32Array([1, 0.96, 0.66, 1]));
        gl.clearBufferiv(gl.COLOR, 1, new Int32Array([0, 0, 0, 0]));
        gl.clearBufferfv(gl.DEPTH, 0, new Float32Array([1]));

        const data = await this.getBlockVertices();
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLE_FAN, data.length / 48 * 5, gl.UNSIGNED_SHORT, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.useProgram(this.quadProgram);
        gl.bindVertexArray(this.quadVao);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.screenTex);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.useProgram(null)
        gl.bindVertexArray(null);

        this.resetNeedRender();
      }

      func?.();

      if (this.controller.alive) {
        requestAnimationFrame(draw);
      }
    }

    requestAnimationFrame(draw);
  }

  getTarget(x: number, y: number): Vector6 | null {
    const gl = this.gl;
    const repCode = new Int32Array(1);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.mainFbo);
    gl.readBuffer(gl.COLOR_ATTACHMENT1);
    gl.readPixels(x, this.HEIGHT - y, 1, 1, this.READ_FORMAT, this.READ_TYPE, repCode);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    if (repCode[0] === 0) return null;

    const result: Vector6 = [
      repCode[0] >> 22 & 0xFF, 
      repCode[0] >> 14 & 0xFF, 
      repCode[0] >>  6 & 0xFF, 
      (repCode[0] >> 4 & 0x3) - 1, 
      (repCode[0] >> 2 & 0x3) - 1, 
      (repCode[0] >> 0 & 0x3) - 1, 
    ];
    console.log(result);

    return result;
  }

  private async initGL() {
    const gl = this.canvas.getContext('webgl2', { alpha: false });
    if (!gl) {
      throw new Error('Your browser does not support webgl2 canvas.');
    }
    this.gl = gl;

    this.mainProgram = this.createProgram(this.mainVsSrc, this.mainFsSrc);
    this.quadProgram = this.createProgram(this.quadVsSrc, this.quadFsSrc);

    this.mainVao = this.createMainVao();
    this.quadVao = this.createQuadVao();

    this.spriteTex = await this.createSpriteTexture();
    this.screenTex = this.createScreenTexture();
    this.targetTex = this.createTargetTexture();

    this.mainFbo = this.createFrameBuffer();

    const uMatProjLoc  = gl.getUniformLocation(this.mainProgram, 'mProj');
    const uMatWorldLoc = gl.getUniformLocation(this.mainProgram, 'mWorld');
    if (!uMatWorldLoc) {
      throw new Error("Failed to get uniform location.");
    }
    this.uMatWorldLoc = uMatWorldLoc;

    const uMainSamplerLoc = gl.getUniformLocation(this.mainProgram, 'sampler');
    const uQuadSamplerLoc = gl.getUniformLocation(this.quadProgram, 'sampler');

    gl.useProgram(this.mainProgram);
    gl.uniformMatrix4fv(uMatProjLoc, false, this.projMat);
    gl.uniform1i(uMainSamplerLoc, 0);

    gl.useProgram(this.quadProgram);
    gl.uniform1i(uQuadSamplerLoc, 1);
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
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 48, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 48, 12);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 48, 24);
    gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 48, 32);
    gl.vertexAttribIPointer(4, 1, gl.INT, 48, 44);

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.enableVertexAttribArray(3);
    gl.enableVertexAttribArray(4);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    return vao;
  }

  private createQuadVao(): WebGLVertexArrayObject {
    const gl = this.gl;
    const vao = gl.createVertexArray();
    if (!vao) {
      throw new Error("Failed to create vertex array object");
    }

    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, this.quadData, gl.STATIC_DRAW);

    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);

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

  private createScreenTexture(): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error("Failed to create main texture.");
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, this.WIDTH, this.HEIGHT);
    gl.bindTexture(gl.TEXTURE_2D, null);
  
    return texture;
  }

  private createTargetTexture(): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error("Failed to create main texture.");
    }

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32I, this.WIDTH, this.HEIGHT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
  
    return texture;
  }

  private createFrameBuffer(): WebGLFramebuffer {
    const gl = this.gl;
    const fbo = gl.createFramebuffer();
    if (!fbo) {
      throw new Error("Failed to create main framebuffer.");
    }
    this.mainFbo = fbo;

    const rbo = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.WIDTH, this.HEIGHT);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.screenTex, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.targetTex, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbo);

    gl.readBuffer(gl.COLOR_ATTACHMENT1);
    this.READ_FORMAT = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT);
    this.READ_TYPE = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return fbo;
  }

  private async getBlockVertices(): Promise<Float32Array> {
    // TODO: only update block changes
    const vertices: number[] = [];
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
              if (!this.shouldRender(block, face.cullface)) return;
              if (!(face.texture in offsets)) {
                throw new Error(`Texture ${face.texture} does not exist in texture atlas.`);
              }

              const { corners: c, texCords: t, normal: n } = face;
              const offset = offsets[face.texture as keyof typeof offsets];
              const coord  = i << 16 | j << 8 | k;
              const norm   = n[0] + 1 << 4 | n[1] + 1 << 2 | n[2] + 1;

              for (let l = 0; l < 4; ++l) {
                vertices.push(
                  c[l][0] + x, c[l][1] + y, c[l][2] + z, 
                  n[0], n[1], n[2], 
                  t[l][0] * factor[0] + offset[0], t[l][1] * factor[1] + offset[1], 
                  ...color, (coord << 6) | norm
                );
              }
            });
          });
        }
      }
    }

    const asFloat32 = new Float32Array(vertices);
    const asInt32 = new Int32Array(asFloat32.buffer);
    for (let i = 11; i < vertices.length; i += 12) {
      asInt32[i] = vertices[i];
    }
    return asFloat32;
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
    layout(location = 4) in highp int a_blockid;

    uniform mat4 mWorld;
    uniform mat4 mProj;

    out mediump vec3 v_colormask;
    out mediump vec2 v_texcoord;
    flat out mediump vec3 v_normal;
    flat out highp int v_blockid;

    void main() {
      v_colormask = a_colormask;
      v_texcoord  = a_texcoord;
      v_blockid   = a_blockid;
      v_normal    = (mWorld * vec4(a_normal, 0.0)).rgb;
      gl_Position = mProj * mWorld * vec4(a_position, 1.0);
    }
  `;

  private mainFsSrc = `#version 300 es
    precision mediump float;

    in mediump vec3 v_colormask;
    in mediump vec2 v_texcoord;
    flat in mediump vec3 v_normal;
    flat in highp int v_blockid;

    const vec3 ambientIntensity = vec3(0.4, 0.4, 0.7);
    const vec3 lightColor = vec3(0.8, 0.8, 0.4);
    const vec3 lightDirection = normalize(vec3(1.0, 2.0, 3.0));
    uniform sampler2D sampler;

    layout(location = 0) out vec4 fragColor;
    layout(location = 1) out highp int blockId;

    void main() {
      vec4 texel = texture(sampler, v_texcoord);
      vec3 lightIntensity = ambientIntensity + lightColor * max(dot(normalize(v_normal), lightDirection), 0.0);

      fragColor = vec4(texel.rgb * v_colormask * lightIntensity, texel.a);
      if (fragColor.a < 0.1) discard;

      blockId = v_blockid;
    }
  `;

  private quadVsSrc = `#version 300 es
    layout(location = 0) in vec4 aPosition;
    layout(location = 1) in vec2 aTexCoord;

    out vec2 vTexCoord;

    void main() {
      gl_Position = aPosition;
      vTexCoord = aTexCoord;
    }
  `;

  private quadFsSrc = `#version 300 es
    precision mediump float;

    in vec2 vTexCoord;

    uniform sampler2D sampler;

    out vec4 fragColor;

    void main() {
      fragColor = texture(sampler, vTexCoord);
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
        0,   cp,  sp, 0, 
      sy, cysp, -cycp, 0, 
      x*cy - z*sy, - x*sysp - y*cp - z*cysp, x*sycp - y*sp + z*cycp, 1, 
    ]);
  }

  private projMat = new Float32Array([
    1, 0,      0,  0, 
    0, 1,      0,  0, 
    0, 0, -1.002, -1, 
    0, 0,   -0.2,  0
  ]);

  private quadData = new Float32Array([-1, 1, 0, 1, -1, -1, 0, 0, 1, 1, 1, 1, 1, -1, 1, 0]);
}

export default Renderer;