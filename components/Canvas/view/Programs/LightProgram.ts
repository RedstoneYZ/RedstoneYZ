import type ProgramManager from "../ProgramManager";
import Program from "./Program";
import { glUnpackif } from "./glImports";

interface Uniforms {
  u_mlp: WebGLUniformLocation;
  s_texture: WebGLUniformLocation;
}

export default class LightProgram extends Program {
  protected program: WebGLProgram;

  private uniform: Uniforms;
  public shadowMap: WebGLTexture;
  private abo: WebGLBuffer;
  private vao: WebGLVertexArrayObject;
  private fbo: WebGLFramebuffer;

  constructor(parent: ProgramManager, gl: WebGL2RenderingContext) {
    super(parent, gl);

    this.program = this.createProgram();
    // this.shadowMap = this.createShadowMap();
    this.abo = this.createAbo();
    this.vao = this.createVao();
    this.fbo = this.createFbo();

    this.uniform = this.setupUniform(["u_mlp", "s_texture"]);
    this.ready = true;
  }

  public draw(): boolean {
    if (!this.ready) return false;

    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.abo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.colorMask(false, false, false, false);

    gl.uniformMatrix4fv(this.uniform.u_mlp, false, this.parent.mlp);

    gl.clear(gl.DEPTH_BUFFER_BIT);

    const data = this.getData();
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLE_FAN, (data.length / 16) * 5, gl.UNSIGNED_SHORT, 0);

    gl.colorMask(true, true, true, true);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);

    return true;
  }

  protected override setupUniform<T extends string>(uniforms: T[]): Uniforms {
    const uniform = super.setupUniform(uniforms) as Uniforms;
    const gl = this.gl;

    gl.useProgram(this.program);
    gl.uniform1i(uniform.s_texture, 1);
    gl.useProgram(null);

    return uniform;
  }

  private getData(): Float32Array {
    const textures = this.parent.renderer.textures;
    const engine = this.parent.engine;
    const data: number[] = [];
    this.parent.renderer.pg.forEach((layer, x) => {
      layer.forEach((column, y) => {
        column.forEach(({ exposedFaces }, z) => {
          exposedFaces.forEach((face) => {
            const { corners: c, texCoord: t, texture: tex } = face;
            const offset = textures.sampleBlock(tex, engine.tick);
            const [ox1, oy1] = offset;

            for (let l = 0; l < 4; ++l) {
              const tex1 = ((t[l][0] + ox1) << 20) | ((t[l][1] + oy1) << 10);
              data.push(c[l][0] + x, c[l][1] + y, c[l][2] + z, tex1);
            }
          });
        });
      });
    });

    const asFloat32 = new Float32Array(data);
    const asInt32 = new Int32Array(asFloat32.buffer);
    for (let i = 0; i < asFloat32.length; i += 4) {
      asInt32[i + 3] = data[i + 3];
    }
    return asFloat32;
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

    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
    gl.vertexAttribIPointer(1, 1, gl.INT, 16, 12);

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.parent.indices), gl.STATIC_DRAW);

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
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.TEXTURE_2D,
      this.parent.textures[0],
      0,
    );
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return fbo;
  }

  protected vsSrc = `#version 300 es
    ${glUnpackif}

    layout(location = 0) in vec3 a_position;
    layout(location = 1) in int a_texture;

    uniform mat4 u_mlp;

    out mediump vec2 v_texcoord;

    void main() {
      gl_Position = u_mlp * vec4(a_position, 1.0);
      v_texcoord.x = unpackif(a_texture, 20, 10) / 256.;
      v_texcoord.y = unpackif(a_texture, 10, 10) / 256.;
    }
  `;

  protected fsSrc = `#version 300 es
    precision mediump float;

    in mediump vec2 v_texcoord;

    uniform sampler2D s_texture;

    void main() {
      if (texture(s_texture, v_texcoord).a < 0.1) {
        discard;
      }
    }
  `;
}
