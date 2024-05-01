import Renderer from "../Renderer";
import Program from "./Program";

interface Uniforms {
  sampler: WebGLUniformLocation;
}

export default class TestProgram extends Program {
  protected program: WebGLProgram;

  private abo: WebGLBuffer;
  private vao: WebGLVertexArrayObject;

  constructor(renderer: Renderer, gl: WebGL2RenderingContext) {
    super(renderer, gl);

    this.program = this.createProgram();
    this.abo = this.createAbo();
    this.vao = this.createVao();
    this.setupUniform(["sampler"]);
    this.ready = true;
  }

  public draw(): boolean {
    if (!this.ready) return false;

    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.abo);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);

    return true;
  }

  protected override setupUniform<T extends string>(uniforms: T[]): Uniforms {
    const uniform = super.setupUniform(uniforms) as Uniforms;
    const gl = this.gl;

    gl.useProgram(this.program);
    gl.uniform1i(uniform.sampler, 1);
    gl.useProgram(null);

    return uniform;
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
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, 1, 0, 1, -1, -1, 0, 0, 1, 1, 1, 1, 1, -1, 1, 0]),
      gl.STATIC_DRAW,
    );

    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);

    gl.bindVertexArray(null);

    return vao;
  }

  protected vsSrc = `#version 300 es
    layout(location = 0) in vec4 a_position;
    layout(location = 1) in vec2 a_texCoord;

    out vec2 v_texCoord;

    void main() {
      gl_Position = a_position;
      v_texCoord = a_texCoord;
    }
  `;

  protected fsSrc = `#version 300 es
    precision mediump float;

    in vec2 v_texCoord;

    uniform sampler2D sampler;

    out vec4 fragColor;

    void main() {
      vec3 depth = texture(sampler, v_texCoord).rrr;
      fragColor = vec4(depth, 1.0);
    }
  `;
}
