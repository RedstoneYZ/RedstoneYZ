import type Renderer from "../Renderer";
import Program from "./Program";

interface Uniforms {
  u_mvp: WebGLUniformLocation;
}

export default class LineProgram extends Program {
  protected program: WebGLProgram;

  private uniform: Uniforms;
  private abo: WebGLBuffer;
  private vao: WebGLVertexArrayObject;

  constructor(renderer: Renderer, gl: WebGL2RenderingContext) {
    super(renderer, gl);

    this.program = this.createProgram();
    this.uniform = this.setupUniform(["u_mvp"]);
    this.abo = this.createAbo();
    this.vao = this.createVao();

    this.ready = true;
  }

  public draw(): boolean {
    if (!this.ready) return false;

    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.abo);

    gl.uniformMatrix4fv(this.uniform.u_mvp, false, this.renderer.mvp);

    const data = this.getData();
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.drawElements(gl.LINE_LOOP, (data.length / 12) * 5, gl.UNSIGNED_SHORT, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);

    return true;
  }

  private getData(): Float32Array {
    const target = this.renderer.getTarget();
    if (!target) return new Float32Array();

    const [x, y, z] = target;
    const block = this.renderer.engine.block(x, y, z);
    if (!block) return new Float32Array();

    const models = this.renderer.models.get(block.type, block.states);
    const result: number[] = [];

    models.forEach(({ outline }) => {
      outline.forEach(({ from: [x1, y1, z1], to: [x2, y2, z2] }) => {
        x1 += x;
        y1 += y;
        z1 += z;
        x2 += x;
        y2 += y;
        z2 += z;
        result.push(
          x1,
          y1,
          z1,
          x1,
          y2,
          z1,
          x2,
          y2,
          z1,
          x2,
          y1,
          z1,
          x1,
          y1,
          z2,
          x1,
          y2,
          z2,
          x2,
          y2,
          z2,
          x2,
          y1,
          z2,
          x1,
          y1,
          z1,
          x1,
          y1,
          z2,
          x2,
          y1,
          z2,
          x2,
          y1,
          z1,
          x1,
          y2,
          z1,
          x1,
          y2,
          z2,
          x2,
          y2,
          z2,
          x2,
          y2,
          z1,
          x1,
          y1,
          z1,
          x1,
          y1,
          z2,
          x1,
          y2,
          z2,
          x1,
          y2,
          z1,
          x2,
          y1,
          z1,
          x2,
          y1,
          z2,
          x2,
          y2,
          z2,
          x2,
          y2,
          z1,
        );
      });
    });

    return new Float32Array(result);
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

    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);

    gl.enableVertexAttribArray(0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.renderer.indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    return vao;
  }

  protected vsSrc = `#version 300 es
    layout(location = 0) in vec3 a_position;

    uniform mat4 u_mvp;

    void main() {
      gl_Position = u_mvp * vec4(a_position, 1.0);
    }
  `;

  protected fsSrc = `#version 300 es
    precision mediump float;

    uniform sampler2D sampler;

    out vec4 fragColor;

    void main() {
      fragColor = vec4(0, 0, 0, 1);
    }
  `;
}
