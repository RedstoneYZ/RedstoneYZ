import type ProgramManager from "../ProgramManager";
import Program from "./Program";
import { glUnpacki, glUnpackif } from "./glImports";

interface Uniforms {
  u_mvp: WebGLUniformLocation;
  s_texture: WebGLUniformLocation;
}

export default class ParticleProgram extends Program {
  protected program: WebGLProgram;

  private uniform: Uniforms;
  private abo: WebGLBuffer;
  private vao: WebGLVertexArrayObject;

  constructor(parent: ProgramManager, gl: WebGL2RenderingContext) {
    super(parent, gl);

    this.program = this.createProgram();
    this.uniform = this.setupUniform(["u_mvp", "s_texture"]);
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

    gl.uniformMatrix4fv(this.uniform.u_mvp, false, this.parent.mvp);
    //gl.uniform3fv(this.uniform.u_lightnorm, this.getLightNorm());

    const data = this.getData();
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLE_FAN, (data.length / 28) * 5, gl.UNSIGNED_SHORT, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);

    return true;
  }
  
  private getLightNorm(): Float32Array {
    const theta = this.parent.sunAngle;
    return new Float32Array([Math.cos(theta), Math.sin(theta), 0]);
  }

  protected override setupUniform<T extends string>(uniforms: T[]): Uniforms {
    const uniform = super.setupUniform(uniforms) as Uniforms;
    const gl = this.gl;

    gl.useProgram(this.program);
    gl.uniform1i(uniform.s_texture, 1);
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

    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 28, 12);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 28, 20);

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.parent.indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    return vao;
  }

  private getData(): Float32Array {
    const textures = this.parent.renderer.textures;
    const engine = this.parent.engine;
    const data: number[] = [];
    engine.particle.forEach((particle) => {
      const {x:x, y:y, z:z, type:type, textureX1:textureX1, textureX2:textureX2, textureY1:textureY1, textureY2:textureY2, randomSize: randomSize} = particle.getData()
      const blockdata = textures.sampleBlock(type, 0);
      const texX1 = (textureX1 + blockdata[0]) / 256;
      const texX2 = (textureX2 + blockdata[0]) / 256;
      const texY1 = (textureY1 + blockdata[1]) / 256;
      const texY2 = (textureY2 + blockdata[1]) / 256;
      const {xyz: {x:cx, y:cy, z:cz}} = this.parent.renderer.controller.player;
      const size = Math.min(1 * Math.pow((x - cx)**2 + (y - cy)**2 + (z - cz)**2 + randomSize, -1), 0.1);
      data.push(x, y, z, -size,  -size, texX1, texY1);
      data.push(x, y, z, size,  -size, texX1, texY2);
      data.push(x, y, z,  size,  size, texX2, texY2);
      data.push(x, y, z,  -size, size, texX2, texY1);
    });
    
    const asFloat32 = new Float32Array(data);
    
    return asFloat32;
  }

  protected vsSrc = `#version 300 es
    ${glUnpacki}
    ${glUnpackif}

    layout(location = 0) in vec3 a_position;
    layout(location = 1) in vec2 a_posOffset;
    layout(location = 2) in vec2 a_texture;

    uniform mat4 u_mvp;
    //uniform vec3 u_lightnorm;

    out mediump vec2 v_texcoord;

    void main() {
      gl_Position = u_mvp * vec4(a_position, 1.0) + vec4(a_posOffset, 0., 1.0);

      v_texcoord = a_texture;
    }
  `;

  protected fsSrc = `#version 300 es
    precision mediump float;

    in mediump vec2 v_texcoord;

    uniform sampler2D s_texture;

    out vec4 fragColor;

    void main() {
      fragColor = texture(s_texture, v_texcoord);
    }
  `;
}


