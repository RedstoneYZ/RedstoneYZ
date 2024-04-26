import Renderer from "../Renderer";
import Program from "./Program";

interface Uniforms {
  mWovi: WebGLUniformLocation;
  mProj: WebGLUniformLocation;
  sampler: WebGLUniformLocation;
}

export default class MainProgram extends Program {
  protected program: WebGLProgram;

  private uniform: Uniforms;
  private abo: WebGLBuffer;
  private vao: WebGLVertexArrayObject;
  private sprite: WebGLTexture;

  constructor(renderer: Renderer, gl: WebGL2RenderingContext) {
    super(renderer, gl);

    this.program = this.createProgram();
    this.uniform = this.setupUniform();
    this.abo = this.createAbo();
    this.vao = this.createVao();

    this.createSprite().then(sprite => {
      this.sprite = sprite;
      this.ready = true;
    });
  }

  public draw(): boolean {
    if (!this.ready) return false;

    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.abo);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sprite);

    gl.uniformMatrix4fv(this.uniform.mWovi, false, this.renderer.worldMat);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const data = this.renderer.getBlockVertices();
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLE_FAN, data.length / 44 * 5, gl.UNSIGNED_SHORT, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);

    return true;
  }

  private setupUniform(): Uniforms {
    const gl = this.gl;

    const mWovi = gl.getUniformLocation(this.program, 'mWovi');
    if (!mWovi) {
      throw new Error("Failed to get location of mWovi.");
    }

    const mProj = gl.getUniformLocation(this.program, 'mProj');
    if (!mProj) {
      throw new Error("Failed to get location of mProj.");
    }

    const sampler = gl.getUniformLocation(this.program, 'sampler');
    if (!sampler) {
      throw new Error("Failed to get location of sampler.");
    }

    gl.useProgram(this.program);
    gl.uniformMatrix4fv(mProj, false, this.renderer.projMat);
    gl.uniform1i(sampler, 0);
    gl.useProgram(null);

    return { mWovi, mProj, sampler };
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

    // TODO: maybe change normal and texcoords to half float
    // COMMENT: wait for https://github.com/tc39/proposal-float16array
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 44, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 44, 12);
    gl.vertexAttribIPointer(2, 2, gl.INT, 44, 24);
    gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 44, 32);

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.enableVertexAttribArray(3);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    return vao;
  }

  private async createSprite(): Promise<WebGLTexture> {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error("Failed to create main texture.");
    }

    const atlas = await new Promise<HTMLImageElement>(res => {
      const image = new Image();
      image.onload = () => res(image);
      image.src = "/static/images/atlas/atlas.png";
    });

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;
  }

  protected vsSrc = `#version 300 es
    layout(location = 0) in vec3 a_position;
    layout(location = 1) in mediump vec3 a_normal;
    layout(location = 2) in ivec2 a_texture;
    layout(location = 3) in mediump vec3 a_colormask;

    uniform mat4 mWovi;
    uniform mat4 mProj;

    out mediump vec2 v_texcoord1;
    out mediump vec2 v_texcoord2;
    out mediump float v_texinter;
    out mediump vec3 v_colormask;
    flat out mediump vec3 v_normal;

    void main() {
      v_texcoord1.x = float(a_texture[0] >> 20 & 1023) / 128.;
      v_texcoord1.y = float(a_texture[0] >> 10 & 1023) / 128.;
      v_texcoord2.x = float(a_texture[0]       & 1023) / 128.;
      v_texcoord2.y = float(a_texture[1] >> 20 & 1023) / 128.;
      v_texinter = float(a_texture[1] >> 10 & 1023) / float(a_texture[1] & 1023);

      v_colormask = a_colormask;
      v_normal    = (mWovi * vec4(a_normal, 0.0)).rgb;

      gl_Position = mProj * mWovi * vec4(a_position, 1.0);
    }
  `;

  protected fsSrc = `#version 300 es
    precision mediump float;

    in mediump vec2 v_texcoord1;
    in mediump vec2 v_texcoord2;
    in mediump float v_texinter;
    in mediump vec3 v_colormask;
    flat in mediump vec3 v_normal;

    const vec3 ambientIntensity = vec3(0.4, 0.4, 0.7);
    const vec3 lightColor = vec3(0.8, 0.8, 0.4);
    const vec3 lightDirection = normalize(vec3(1.0, 2.0, 3.0));
    uniform sampler2D sampler;

    out vec4 fragColor;

    void main() {
      vec4 texel1 = texture(sampler, v_texcoord1);
      vec4 texel2 = texture(sampler, v_texcoord2);
      vec4 texel  = texel1 * v_texinter + texel2 * (1. - v_texinter);

      vec3 lightIntensity = ambientIntensity + lightColor * max(dot(normalize(v_normal), lightDirection), 0.0);

      fragColor = vec4(texel.rgb * v_colormask * lightIntensity, texel.a);
      if (fragColor.a < 0.1) discard;
    }
  `;

  private indices = new Uint16Array(Array.from(
    { length: 4096 }, 
    (_, i) => {
      i <<= 2;
      return [i, i + 1, i + 2, i + 3, 65535];
    }
  ).flat());
}


/**
  * a_texture format (ivec2)
  * a_texture[0]: 00000000 00000000 00000000 00000000
  *                 └─────────┘└─────────┘└─────────┘
  *                   tex1.x     tex1.y     tex2.x
  * a_texture[1]: 00000000 00000000 00000000 00000000
  *                 └─────────┘└─────────┘└─────────┘
  *                   tex2.y     inter.d    intex.n
 */