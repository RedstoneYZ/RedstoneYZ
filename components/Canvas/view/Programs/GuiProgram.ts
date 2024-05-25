import type { Vector2 } from "../../model/types";
import type ProgramManager from "../ProgramManager";
import Program from "./Program";

interface Uniforms {
  screensize: WebGLUniformLocation;
  sampler: WebGLUniformLocation;
}

export default class HotBarProgram extends Program {
  protected program: WebGLProgram;

  private abo: WebGLBuffer;
  private vao: WebGLVertexArrayObject;

  private readonly slotSize: number;
  private readonly pixelSize: number;
  private readonly hotbarOffset: Vector2;

  constructor(parent: ProgramManager, gl: WebGL2RenderingContext) {
    super(parent, gl);

    this.program = this.createProgram();
    this.setupUniform(["screensize", "sampler"]);
    this.abo = this.createAbo();
    this.vao = this.createVao();

    const width = this.parent.renderer.canvasW;
    const height = this.parent.renderer.canvasH;
    this.slotSize = Math.min(width / 18, height / 10);
    this.pixelSize = this.slotSize / 20;
    this.hotbarOffset = [
      width / 2 - (this.slotSize * 4.5 + this.pixelSize),
      height - (this.slotSize + 10),
    ];

    this.ready = true;
  }

  public draw(): boolean {
    if (!this.ready) return false;

    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.abo);

    const data = this.getData();
    gl.bufferData(gl.ARRAY_BUFFER, this.getData(), gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLE_FAN, data.length, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);

    return true;
  }

  private getData(): Float32Array {
    const slot = this.slotSize;
    let [xOffset, yOffset] = this.hotbarOffset;
    xOffset += this.pixelSize;
    yOffset += this.pixelSize;

    const attiArray = this.fixedData;

    this.parent.controller.hotbar.forEach((item, i) => {
      let [tx, ty] = this.parent.renderer.textures.sampleItem(item);
      if (tx === -1) {
        // need to sample block
        const blockdata = this.parent.renderer.textures.sampleBlock(item, 0);
        tx = blockdata[0] / 256;
        ty = blockdata[1] / 256;
        /**          (0, 0)
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

        /* eslint-disable */
        attiArray.push(
          xOffset + (i + 0.50) * slot, yOffset + 0.10 * slot, -0.999, tx         , ty         ,
          xOffset + (i + 0.14) * slot, yOffset + 0.28 * slot, -0.999, tx         , ty + 0.0625,
          xOffset + (i + 0.50) * slot, yOffset + 0.46 * slot, -0.999, tx + 0.0625, ty + 0.0625,
          xOffset + (i + 0.86) * slot, yOffset + 0.28 * slot, -0.999, tx + 0.0625, ty         ,

          xOffset + (i + 0.14) * slot, yOffset + 0.28 * slot, -0.999, tx         , ty         ,
          xOffset + (i + 0.14) * slot, yOffset + 0.72 * slot, -0.999, tx         , ty + 0.0625,
          xOffset + (i + 0.50) * slot, yOffset + 0.90 * slot, -0.999, tx + 0.0625, ty + 0.0625,
          xOffset + (i + 0.50) * slot, yOffset + 0.46 * slot, -0.999, tx + 0.0625, ty         ,

          xOffset + (i + 0.50) * slot, yOffset + 0.46 * slot, -0.999, tx         , ty         ,
          xOffset + (i + 0.50) * slot, yOffset + 0.90 * slot, -0.999, tx         , ty + 0.0625,
          xOffset + (i + 0.86) * slot, yOffset + 0.72 * slot, -0.999, tx + 0.0625, ty + 0.0625,
          xOffset + (i + 0.86) * slot, yOffset + 0.28 * slot, -0.999, tx + 0.0625, ty         ,
        )
        /* eslint-enable */
      } else {
        tx /= 256;
        ty /= 256;

        /* eslint-disable */
        attiArray.push(
          xOffset + (i + 0.1) * slot, yOffset + 0.1 * slot, -0.999, tx         , ty         ,
          xOffset + (i + 0.1) * slot, yOffset + 0.9 * slot, -0.999, tx         , ty + 0.0625,
          xOffset + (i + 0.9) * slot, yOffset + 0.9 * slot, -0.999, tx + 0.0625, ty + 0.0625,
          xOffset + (i + 0.9) * slot, yOffset + 0.1 * slot, -0.999, tx + 0.0625, ty         ,
        );
        /* eslint-enable */
      }
    });
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

    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.parent.indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    return vao;
  }

  protected vsSrc = `#version 300 es
    layout(location = 0) in vec3 a_position;
    layout(location = 1) in vec2 a_texcoord;

    uniform ivec2 screensize;

    out mediump vec2 v_texcoord;

    void main() {
      vec2 clipSpace = (a_position.xy / vec2(screensize)) * 2. - 1.;
      gl_Position = vec4(clipSpace * vec2(1., -1.), a_position.z, 1);
      v_texcoord = a_texcoord;
    }
  `;

  protected fsSrc = `#version 300 es
    precision mediump float;

    in mediump vec2 v_texcoord;

    uniform sampler2D sampler;

    out vec4 fragColor;

    void main() {
      fragColor = texture(sampler, v_texcoord);
    }
  `;

  private get fixedData() {
    const data: number[] = [];
    let x1, y1, x2, y2, tx, ty;

    const width = this.parent.renderer.canvasW;
    const height = this.parent.renderer.canvasH;
    const slot = this.slotSize;
    const pixel = this.pixelSize;

    /* eslint-disable */
    [x1, y1] = [width / 2 - (slot * 4.5 + pixel), height - (slot + 10)];
    [x2, y2] = [x1 + slot * 9 + 2 * pixel, y1 + slot + 2 * pixel];
    [tx, ty] = this.parent.renderer.textures.sampleGui('hotbar');
    [tx, ty] = [tx / 256, ty / 256];
    data.push(
      x1 + 0.0005, y1 + 0.0005, -0.997, tx            , ty           , 
      x1 + 0.0005, y2 - 0.0005, -0.997, tx            , ty + 22 / 256, 
      x2 - 0.0005, y2 - 0.0005, -0.997, tx + 182 / 256, ty + 22 / 256, 
      x2 - 0.0005, y1 + 0.0005, -0.997, tx + 182 / 256, ty           , 
    );
    
    const index = this.parent.controller.hotbarIndex;
    [x1, y1] = [x1 - pixel + index * slot, y1 - pixel];
    [x2, y2] = [x1 + slot + 4 * pixel, y1 + slot + 3 * pixel];
    [tx, ty] = this.parent.renderer.textures.sampleGui('hotbar_selection');
    [tx, ty] = [tx / 256, ty / 256];
    data.push(
      x1 + 0.0005, y1 + 0.0005, -0.998, tx           , ty           , 
      x1 + 0.0005, y2 - 0.0005, -0.998, tx           , ty + 23 / 256, 
      x2 - 0.0005, y2 - 0.0005, -0.998, tx + 24 / 256, ty + 23 / 256, 
      x2 - 0.0005, y1 + 0.0005, -0.998, tx + 24 / 256, ty           , 
    );

    [x1, y1] = [width / 2 - 7.5 * pixel, height / 2 - 7.5 * pixel];
    [x2, y2] = [x1 + 15 * pixel, y1 + 15 * pixel];
    [tx, ty] = this.parent.renderer.textures.sampleGui('crosshair');
    [tx, ty] = [tx / 256, ty / 256];
    data.push(
      x1 + 0.0005, y1 + 0.0005, -0.999, tx           , ty           , 
      x1 + 0.0005, y2 - 0.0005, -0.999, tx           , ty + 15 / 256, 
      x2 - 0.0005, y2 - 0.0005, -0.999, tx + 15 / 256, ty + 15 / 256, 
      x2 - 0.0005, y1 + 0.0005, -0.999, tx + 15 / 256, ty           , 
    );

    return data;
    /* eslint-enable */
  }
}
