import Renderer from "../Renderer";
import Program from "./Program";

interface Uniforms {
  u_mvp: WebGLUniformLocation;
  sampler: WebGLUniformLocation;
}

export default class HotbarProgram extends Program {
  protected program: WebGLProgram;

  private uniform: Uniforms;
  private abo: WebGLBuffer;
  private vao: WebGLVertexArrayObject;
  

  constructor(renderer: Renderer, gl: WebGL2RenderingContext) {
    super(renderer, gl);

    this.program = this.createProgram();
    this.uniform = this.setupUniform(["u_mvp", "sampler"]);
    this.abo = this.createAbo();
    this.vao = this.createVao();

    this.createSprite().then(() => {
      this.ready = true;
    });
  }

  public draw(): boolean {
    if (!this.ready) return false;

    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.abo);


    gl.bufferData(gl.ARRAY_BUFFER, this.getData(), gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLE_FAN, 4, gl.UNSIGNED_SHORT, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);

    return true;
  }

  private getData(): Float32Array {

    

    return new Float32Array([
      1,
    ]);
  }

  protected override setupUniform<T extends string>(uniforms: T[]): Uniforms {
    const uniform = super.setupUniform(uniforms) as Uniforms;
    const gl = this.gl;

    gl.useProgram(this.program);
    gl.uniform1i(uniform.sampler, 2);
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
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.renderer.indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    return vao;
  }

  private async createSprite(): Promise<WebGLTexture> {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error("Failed to create main texture.");
    }

    const hotBar = await new Promise<HTMLImageElement>((res) => {
      const image = new Image();
      image.onload = () => res(image);
      image.src = "/static/images/textures/gui/hotbar.png";
    });

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, hotBar);

    return texture;
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
