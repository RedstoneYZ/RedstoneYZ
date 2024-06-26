import type ProgramManager from "../ProgramManager";
import Matrix4 from "../utils/Matrix4";
import Program from "./Program";

interface Uniforms {
  u_mvp: WebGLUniformLocation;
  sampler: WebGLUniformLocation;
}

export default class EnvironmentProgram extends Program {
  protected program: WebGLProgram;

  private uniform: Uniforms;
  private abo: WebGLBuffer;
  private vao: WebGLVertexArrayObject;

  constructor(parent: ProgramManager, gl: WebGL2RenderingContext) {
    super(parent, gl);

    this.program = this.createProgram();
    this.uniform = this.setupUniform(["u_mvp", "sampler"]);
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

    gl.uniformMatrix4fv(this.uniform.u_mvp, false, this.mvp);

    gl.bufferData(gl.ARRAY_BUFFER, this.getData(), gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLE_FAN, 4, gl.UNSIGNED_SHORT, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);

    return true;
  }

  private getData(): Float32Array {
    let [tx, ty] = this.parent.renderer.textures.sampleEnvironment("sun");
    tx /= 256;
    ty /= 256;

    const theta = this.parent.sunAngle;
    const phi = this.parent.seasonAngle;

    const vs = Matrix4.Multiply(
      new Float32Array([60, 20, 20, 1, 60, 20, -20, 1, 60, -20, -20, 1, 60, -20, 20, 1]),
      Matrix4.RotateY((23.4 * Math.sin(phi) * Math.PI) / 180),
      Matrix4.RotateZ(theta),
      Matrix4.RotateX((25.04 * Math.PI) / 180),
    );

    return new Float32Array([
      vs[0],
      vs[1],
      vs[2],
      tx + 0.001,
      ty + 0.001,
      vs[4],
      vs[5],
      vs[6],
      tx + 0.124,
      ty + 0.001,
      vs[8],
      vs[9],
      vs[10],
      tx + 0.124,
      ty + 0.124,
      vs[12],
      vs[13],
      vs[14],
      tx + 0.001,
      ty + 0.124,
    ]);
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
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0]), gl.STATIC_DRAW);

    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.parent.indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    return vao;
  }

  private get mvp(): Float32Array {
    const {
      xyz: { x, y, z },
    } = this.parent.controller.player;

    return Matrix4.Multiply(Matrix4.Translate(x, y, z), this.parent.mvp);
  }

  protected vsSrc = `#version 300 es
    layout(location = 0) in vec3 a_position;
    layout(location = 1) in vec2 a_texcoord;

    uniform mat4 u_mvp;

    out mediump vec2 v_texcoord;

    void main() {
      gl_Position = u_mvp * vec4(a_position, 1.0);
      v_texcoord = a_texcoord;
    }
  `;

  protected fsSrc = `#version 300 es
    precision mediump float;

    in mediump vec2 v_texcoord;

    uniform sampler2D sampler;

    out vec4 fragColor;

    void main() {
      vec4 texel = texture(sampler, v_texcoord);
      float value = max(max(texel.r, texel.g), texel.b);

      if (value == 0.) discard;

      float darkness = 1. - value;
      fragColor = vec4(texel.rgb + vec3(darkness, darkness, darkness), value);
    }
  `;
}
