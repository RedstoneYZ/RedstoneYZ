import { BlockType } from "../../model/types";
import Renderer from "../Renderer";
import Program from "./Program";

interface Uniforms {
  mWovi: WebGLUniformLocation;
  mProj: WebGLUniformLocation;
}

export default class LightProgram extends Program {
  protected program: WebGLProgram;

  private uniform: Uniforms;
  public shadowMap: WebGLTexture;
  private abo: WebGLBuffer;
  private vao: WebGLVertexArrayObject;
  private fbo: WebGLFramebuffer;

  public projMat: Float32Array;

  constructor(renderer: Renderer, gl: WebGL2RenderingContext) {
    super(renderer, gl);

    this.program = this.createProgram();
    this.shadowMap = this.createShadowMap();
    this.abo = this.createAbo();
    this.vao = this.createVao();
    this.fbo = this.createFbo();

    const x = this.renderer.WIDTH > this.renderer.HEIGHT ? this.renderer.HEIGHT / this.renderer.WIDTH : 1;
    const y = this.renderer.WIDTH > this.renderer.HEIGHT ? 1 : this.renderer.WIDTH / this.renderer.HEIGHT;

    this.projMat = new Float32Array([
      x*0.15, 0,      0,  0, 
      0, y*0.15,      0,  0, 
      0, 0, -0.1, 0, 
      0, 0,   6,  1
    ]);

    this.uniform = this.setupUniform();
    this.ready = true;
  }

  public draw(): boolean {
    if (!this.ready) return false;

    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.abo);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);

    gl.uniformMatrix4fv(this.uniform.mWovi, false, this.worldMat);

    gl.clear(gl.DEPTH_BUFFER_BIT);

    const data = this.getData();
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLE_FAN, data.length / 3 * 5, gl.UNSIGNED_SHORT, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);

    return true;
  }

  private getData(): Float32Array {
    const vertices: number[] = [];
    for (let x = 0; x < this.renderer.dimensions[0]; x++) {
      for (let y = 0; y < this.renderer.dimensions[1]; y++) {
        for (let z = 0; z < this.renderer.dimensions[2]; z++) {
          const block = this.renderer.engine.block(x, y, z);
          if (!block || block.type === BlockType.AirBlock) continue;

          const models = this.renderer.models.get(block.type, block.states);
          models.forEach(model => {
            model.faces.forEach(face => {
              if (!this.renderer.shouldRender(block, face)) return;

              const { corners: c } = face;

              for (let l = 0; l < 4; ++l) {
                vertices.push(
                  c[l][0] + x, c[l][1] + y, c[l][2] + z, 
                );
              }
            });
          });
        }
      }
    }
    return new Float32Array(vertices);
  }

  private setupUniform(): Uniforms {
    const gl = this.gl;

    const mWovi = gl.getUniformLocation(this.program, 'mWovi');
    if (!mWovi) {
      throw new Error("Failed to get location of mWovi.");
    }

    const mProj = gl.getUniformLocation(this.program, 'mProj');
    if (!mProj) {
      throw new Error("Failed to get location of mProj.");
    }

    gl.useProgram(this.program);
    gl.uniformMatrix4fv(mProj, false, this.projMat);
    gl.useProgram(null);

    return { mWovi, mProj };
  }

  private createAbo(): WebGLBuffer {
    const buffer = this.gl.createBuffer();
    if (!buffer) {
      throw new Error("Failed to create main array buffer object");
    }
    return buffer;
  }

  private createVao(): WebGLVertexArrayObject {
    const gl = this.gl;
    const vao = gl.createVertexArray();
    if (!vao) {
      throw new Error("Failed to create main vertex array object");
    }

    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.abo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0]), gl.STATIC_DRAW);

    // TODO: maybe change normal and texcoords to half float
    // COMMENT: wait for https://github.com/tc39/proposal-float16array
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);

    gl.enableVertexAttribArray(0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    return vao;
  }

  private createFbo(): WebGLFramebuffer {
    const gl = this.gl;
    const fbo = gl.createFramebuffer();
    if (!fbo) {
      throw new Error("Failed to create main framebuffer.");
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.shadowMap, 0);
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return fbo;
  }

  private createShadowMap(): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error("Failed to create main texture.");
    }

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT16, this.renderer.WIDTH, this.renderer.HEIGHT);

    return texture;
  }

  protected vsSrc = `#version 300 es
    layout(location = 0) in vec3 a_position;

    uniform mat4 mWovi;
    uniform mat4 mProj;

    void main() {
      gl_Position = mProj * mWovi * vec4(a_position, 1.0);
    }
  `;

  protected fsSrc = `#version 300 es
    precision mediump float;
    void main() {
    }
  `;

  public get worldMat(): Float32Array {
    const d = 60;
    const tick = this.renderer.engine.tick % 24000;
    const theta = tick * Math.PI / 240;
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const x = d*c;
    const y = -d*s;
    const z = 0;

    return new Float32Array([
     0, -s, c, 0, 
     0,  c, s, 0, 
    -1,  0, 0, 0, 
    -z, -s*x - c*y, c*x - s*y, 1, 
    ]);
  }

  private indices = new Uint16Array(Array.from(
    { length: 4096 }, 
    (_, i) => {
      i <<= 2;
      return [i, i + 1, i + 2, i + 3, 65535];
    }
  ).flat());
}


/**
  * a_texture format (ivec2)
  *               3 2         1         0         
  *               10987654321098765432109876543210
  * a_texture[0]: 00000000000000000000000000000000
  *                 └ tex1.x ┘└ tex1.y ┘└ tex2.x ┘
  * a_texture[1]: 00000000000000000000000000000000
  *                 └ tex2.y ┘└ inpo.d ┘└ inpo.n ┘
 */