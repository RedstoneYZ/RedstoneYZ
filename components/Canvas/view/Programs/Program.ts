import type ProgramManager from "../ProgramManager";

export default abstract class Program {
  protected parent: ProgramManager;

  protected gl: WebGL2RenderingContext;
  protected ready: boolean;

  protected abstract program: WebGLProgram;
  protected abstract vsSrc: string;
  protected abstract fsSrc: string;

  public abstract draw(): boolean;

  constructor(parent: ProgramManager, gl: WebGL2RenderingContext) {
    this.parent = parent;
    this.gl = gl;
    this.ready = false;
  }

  protected createProgram() {
    const gl = this.gl;
    const program = gl.createProgram();
    if (!program) {
      throw new Error("Failed to create program.");
    }

    const vs = this.createShader(gl.VERTEX_SHADER, this.vsSrc);
    const fs = this.createShader(gl.FRAGMENT_SHADER, this.fsSrc);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error("Program Link Error\n" + gl.getProgramInfoLog(program)?.toString());
    }

    // TODO: Don't validate at build
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
      throw new Error("Program Validate Error\n" + gl.getProgramInfoLog(program)?.toString());
    }

    return program;
  }

  private createShader(type: number, src: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error("Failed to create shader.");
    }
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error("Shader Compilation Error\n" + gl.getShaderInfoLog(shader)?.toString());
    }

    return shader;
  }

  protected setupUniform<T extends string>(uniforms: T[]): any {
    const result: Record<string, WebGLUniformLocation> = {};
    uniforms.forEach((uniform) => {
      const location = this.gl.getUniformLocation(this.program, uniform);
      if (!location) {
        throw new Error(`Failed to get location of ${uniform}`);
      }
      result[uniform] = location;
    });
    return result;
  }
}
