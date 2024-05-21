import type ProgramManager from "../ProgramManager";
import Program from "./Program";

interface Uniforms {
  screensize: WebGLUniformLocation;
  sampler: WebGLUniformLocation;
}

export default class HotBarProgram extends Program {
  protected program: WebGLProgram;

  private uniform: Uniforms;
  private abo: WebGLBuffer;
  private vao: WebGLVertexArrayObject;
  private attiArraylen: number;

  constructor(parent: ProgramManager, gl: WebGL2RenderingContext) {
    super(parent, gl);

    this.program = this.createProgram();
    this.uniform = this.setupUniform(["screensize", "sampler"]);
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

    gl.bufferData(gl.ARRAY_BUFFER, this.getData(), gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLE_FAN, this.attiArraylen, gl.UNSIGNED_SHORT, 0);
    console.log(this.parent.controller.hotbarIndex)
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);

    return true;
  }

  private getData(): Float32Array {
    const hotbarTexture = [0, 128], hotbarSelTexture = [180, 128];
    const canvasWidth = this.parent.renderer.canvasW, canvasHeight = this.parent.renderer.canvasH;
    const edge = 0.06 * canvasWidth, x_offset = 0.23 * canvasWidth, y_offset = canvasHeight - 10;
    
    const hotbarIndex = this.parent.controller.hotbarIndex;
    const gui_pos = new Float32Array([x_offset, x_offset + 9 * edge,  y_offset - edge, y_offset]) // x1, x2, y1, y2
    const sel_pos = new Float32Array([x_offset + (hotbarIndex - 0.05) * edge, x_offset + hotbarIndex * edge + 1.05 * edge,  y_offset - 1.05 * edge, y_offset + 0.05 * edge]) // x1, x2, y1, y2

    let attiArray = [
      gui_pos[0],
      gui_pos[2],
      0,
      hotbarTexture[0] / 256,
      hotbarTexture[1] / 256,
      gui_pos[0],
      gui_pos[3],
      0,
      hotbarTexture[0] / 256,
      (hotbarTexture[1] + 20) / 256,
      gui_pos[1],
      gui_pos[3],
      0,
      (hotbarTexture[0] + 180) / 256,
      (hotbarTexture[1] + 20) / 256,
      gui_pos[1],
      gui_pos[2],
      0,
      (hotbarTexture[0] + 180) / 256,
      hotbarTexture[1] / 256,
      sel_pos[0],
      sel_pos[2],
      1,
      hotbarSelTexture[0] / 256,
      hotbarSelTexture[1] / 256,
      sel_pos[0],
      sel_pos[3],
      1,
      hotbarSelTexture[0] / 256,
      (hotbarSelTexture[1] + 22) / 256,
      sel_pos[1],
      sel_pos[3],
      1,
      (hotbarSelTexture[0] + 22) / 256,
      (hotbarSelTexture[1] + 22) / 256,
      sel_pos[1],
      sel_pos[2],
      1,
      (hotbarSelTexture[0] + 22) / 256,
      hotbarSelTexture[1] / 256,
    ];

    
    for(const item of this.parent.controller.hotbar) {
      let [tx, ty] = this.parent.renderer.textures.sampleItem(item);
      if(tx === -1) { // need to sample block
        let blockdata = this.parent.renderer.textures.sampleBlock(item, 0);
        tx = blockdata[0] / 256;
        ty = blockdata[1] / 256;
        /*          (0, 0)
         *                     0(0.5 edge, 0.1 edge)
         *                     /                    \
         *        1(0.14 edge, 0.28 edge)  2(0.86 edge, 0.28 edge)
         *        |            \                    /            |
         *        |            3(0.5 edge, 0.46 edge)            |
         *        |                      |                       |
         *        4(0.14 edge, 0.72 edge)| 5(0.86 edge, 0.72 edge)
         *               \               |               /
         *                     6(0.5 edge, 0.9 edge)
         */

        const index = this.parent.controller.hotbar.indexOf(item);
        attiArray.push(x_offset + (index + 0.86) * edge , y_offset - 0.72 * edge, 2, tx, ty);
        attiArray.push(x_offset + (index + 0.5) * edge , y_offset - 0.9 * edge, 2, tx + 0.0625, ty);
        attiArray.push(x_offset + (index + 0.14) * edge , y_offset - 0.72 * edge, 2, tx + 0.0625, ty + 0.0625);
        attiArray.push(x_offset + (index + 0.5) * edge , y_offset - 0.54 * edge, 2, tx, ty + 0.0625);
        
        attiArray.push(x_offset + (index + 0.14) * edge , y_offset - 0.72 * edge, 2, tx, ty);
        attiArray.push(x_offset + (index + 0.14) * edge , y_offset - 0.28 * edge, 2, tx + 0.0625, ty);
        attiArray.push(x_offset + (index + 0.5) * edge , y_offset - 0.1 * edge, 2, tx + 0.0625, ty + 0.0625);
        attiArray.push(x_offset + (index + 0.5) * edge , y_offset - 0.54 * edge, 2, tx, ty + 0.0625);

        attiArray.push(x_offset + (index + 0.86) * edge , y_offset - 0.72 * edge, 2, tx, ty);
        attiArray.push(x_offset + (index + 0.5) * edge , y_offset - 0.54 * edge, 2, tx + 0.0625, ty);
        attiArray.push(x_offset + (index + 0.5) * edge , y_offset - 0.1 * edge, 2, tx + 0.0625, ty + 0.0625);
        attiArray.push(x_offset + (index + 0.86) * edge , y_offset - 0.28 * edge, 2, tx, ty + 0.0625);
      }
      else {
        tx /= 256;
        ty /= 256;
        const index = this.parent.controller.hotbar.indexOf(item);
        attiArray.push(x_offset + (index + 1 - 0.1) * edge , y_offset - 0.9 * edge, 2, tx, ty);
        attiArray.push(x_offset + (index + 0.1) * edge , y_offset - 0.9 * edge, 2, tx + 0.0625, ty);
        attiArray.push(x_offset + (index + 0.1) * edge , y_offset - 0.1 * edge, 2, tx + 0.0625, ty + 0.0625);
        attiArray.push(x_offset + (index + 1 - 0.1) * edge , y_offset - 0.1 * edge, 2, tx, ty + 0.0625);
      }
    }
    this.attiArraylen = Math.round(attiArray.length / 20 + attiArray.length / 5 - 1);
    return new Float32Array(attiArray);
  }

  protected override setupUniform<T extends string>(uniforms: T[]): Uniforms {
    const uniform = super.setupUniform(uniforms) as Uniforms;
    const gl = this.gl;

    gl.useProgram(this.program);
    gl.uniform2iv(uniform.screensize, [this.parent.renderer.canvasW, this.parent.renderer.canvasH]);
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
      else if(gui_id == 1.) gl_Position = vec4(clipSpace * vec2(1., -1.), -0.9991, 1);
      else gl_Position = vec4(clipSpace * vec2(1., -1.), -0.9992, 1);
      
      v_texcoord = a_texcoord;
      v_gui_id = gui_id;
    }
  `;

  protected fsSrc = `#version 300 es
    precision mediump float;

    in mediump vec2 v_texcoord;
    in float v_gui_id;

    uniform sampler2D sampler;

    out vec4 fragColor;

    void main() {
      vec4 texel;
      texel = texture(sampler, v_texcoord);
      if(texel.r == 0.) discard;
      fragColor = vec4(texel.rgb, 1.0);
    }
  `;
}
