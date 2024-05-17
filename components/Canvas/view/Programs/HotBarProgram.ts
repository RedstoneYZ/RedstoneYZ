import ProgramManager from "../ProgramManager";
import Program from "./Program";

interface Uniforms {
  screensize: WebGLUniformLocation;
  sampler1: WebGLUniformLocation;
  sampler2: WebGLUniformLocation;
}

export default class HotBarProgram extends Program {
  protected program: WebGLProgram;

  private uniform: Uniforms;
  private abo: WebGLBuffer;
  private vao: WebGLVertexArrayObject;

  constructor(parent: ProgramManager, gl: WebGL2RenderingContext) {
    super(parent, gl);

    this.program = this.createProgram();
    this.uniform = this.setupUniform(["screensize", "sampler1", "sampler2"]);
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
    gl.drawElements(gl.TRIANGLE_FAN, 9, gl.UNSIGNED_SHORT, 0);
    console.log(this.parent.controller.hotbarIndex)
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);

    return true;
  }

  private getData(): Float32Array {
    
    const canvasWidth = this.parent.renderer.canvasW, canvasHeight = this.parent.renderer.canvasH;
    const edge = 0.06 * canvasWidth, x_offset = 0.23 * canvasWidth, y_offset = canvasHeight - 10;
    const hotbarIndex = this.parent.controller.hotbarIndex;
    const gui_pos = new Float32Array([x_offset, x_offset + 9 * edge,  y_offset - edge, y_offset]) // x1, x2, y1, y2
    const sel_pos = new Float32Array([x_offset + (hotbarIndex - 0.05) * edge, x_offset + hotbarIndex * edge + 1.05 * edge,  y_offset - 1.05 * edge, y_offset + 0.05 * edge]) // x1, x2, y1, y2
    return new Float32Array([
      gui_pos[0],
      gui_pos[2],
      0,
      0,
      0,
      gui_pos[0],
      gui_pos[3],
      0,
      0,
      1,
      gui_pos[1],
      gui_pos[3],
      0,
      1,
      1,
      gui_pos[1],
      gui_pos[2],
      0,
      1,
      0,
      sel_pos[0],
      sel_pos[2],
      1,
      0,
      0,
      sel_pos[0],
      sel_pos[3],
      1,
      0,
      1,
      sel_pos[1],
      sel_pos[3],
      1,
      1,
      1,
      sel_pos[1],
      sel_pos[2],
      1,
      1,
      0,
    ]);
  }

  protected override setupUniform<T extends string>(uniforms: T[]): Uniforms {
    const uniform = super.setupUniform(uniforms) as Uniforms;
    const gl = this.gl;

    gl.useProgram(this.program);
    gl.uniform2iv(uniform.screensize, [this.parent.renderer.canvasW, this.parent.renderer.canvasH]);
    gl.uniform1i(uniform.sampler1, 3);
    gl.uniform1i(uniform.sampler2, 4);
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

    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 20, 8);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 20, 12);
    

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.parent.indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    return vao;
  }

  private async createSprite(): Promise<WebGLTexture> {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error("Failed to create main texture.");
    }

    const hotbar = await new Promise<HTMLImageElement>((res) => {
      const image = new Image();
      image.onload = () => res(image);
      image.src = "/images/textures/gui/hotbar.png";
    });
    
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, hotbar);
    
    const hotbarsel = await new Promise<HTMLImageElement>((res) => {
      const image = new Image();
      image.onload = () => res(image);
      image.src = "/images/textures/gui/hotbar_selection.png";
    });

    
    const texture1 = gl.createTexture();
    if (!texture1) {
      throw new Error("Failed to create main texture.");
    }

    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, hotbarsel);

    return texture;
  }

  

  protected vsSrc = `#version 300 es
    layout(location = 0) in vec2 a_position;
    layout(location = 1) in float gui_id;
    layout(location = 2) in vec2 a_texcoord;

    uniform ivec2 screensize;

    out mediump vec2 v_texcoord;
    out float v_gui_id;

    void main() {

      vec2 clipSpace = (a_position / vec2(screensize)) * 2. - 1.;
      
      if(gui_id == 0.) gl_Position = vec4(clipSpace * vec2(1., -1.), -0.999, 1);
      else gl_Position = vec4(clipSpace * vec2(1., -1.), -0.9991, 1);
      
      v_texcoord = a_texcoord;
      v_gui_id = gui_id;
    }
  `;

  protected fsSrc = `#version 300 es
    precision mediump float;

    in mediump vec2 v_texcoord;
    in float v_gui_id;

    uniform sampler2D sampler1;
    uniform sampler2D sampler2;

    out vec4 fragColor;

    void main() {
      vec4 texel;
      if(v_gui_id == 0.) texel = texture(sampler1, v_texcoord);
      else texel = texture(sampler2, v_texcoord);
      if(texel.r == 0.) discard;
      fragColor = vec4(texel.rgb, 1.0);
    }
  `;
}
