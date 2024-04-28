import Renderer from "../Renderer";
import LightProgram from "./LightProgram";
import Program from "./Program";

interface Uniforms {
  mWovi: WebGLUniformLocation;
  mProj: WebGLUniformLocation;
  mWovil: WebGLUniformLocation;
  mProjl: WebGLUniformLocation;
  lightnorm: WebGLUniformLocation;
  s_texture: WebGLUniformLocation;
  s_shadow: WebGLUniformLocation;
}

export default class MainProgram extends Program {
  protected program: WebGLProgram;

  private uniform: Uniforms;
  private abo: WebGLBuffer;
  private vao: WebGLVertexArrayObject;

  constructor(renderer: Renderer, gl: WebGL2RenderingContext) {
    super(renderer, gl);

    this.program = this.createProgram();
    this.uniform = this.setupUniform();
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

    gl.uniformMatrix4fv(this.uniform.mWovi, false, this.renderer.worldMat);
    gl.uniformMatrix4fv(this.uniform.mWovil, false, (this.renderer.programs[0] as LightProgram).worldMat);
    gl.uniform3fv(this.uniform.lightnorm, this.getLightNorm());

    const data = this.renderer.getBlockVertices();
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLE_FAN, data.length / 44 * 5, gl.UNSIGNED_SHORT, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);

    return true;
  }

  private getLightNorm(): Float32Array {
    const tick = this.renderer.engine.tick % 24000;
    const theta = tick * Math.PI / 240;
    return new Float32Array([Math.cos(theta), Math.sin(theta), 0]);
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

    const mWovil = gl.getUniformLocation(this.program, 'mWovil');
    if (!mWovil) {
      throw new Error("Failed to get location of mWovil.");
    }

    const mProjl = gl.getUniformLocation(this.program, 'mProjl');
    if (!mProjl) {
      throw new Error("Failed to get location of mProjl.");
    }

    const lightnorm = gl.getUniformLocation(this.program, 'lightnorm');
    if (!lightnorm) {
      throw new Error("Failed to get location of lightnorm.");
    }

    const s_texture = gl.getUniformLocation(this.program, 's_texture');
    if (!s_texture) {
      throw new Error("Failed to get location of s_texture.");
    }

    const s_shadow = gl.getUniformLocation(this.program, 's_shadow');
    if (!s_shadow) {
      throw new Error("Failed to get location of s_shadow.");
    }

    gl.useProgram(this.program);
    gl.uniformMatrix4fv(mProj, false, this.renderer.projMat);
    gl.uniformMatrix4fv(mProjl, false, (this.renderer.programs[0] as LightProgram).projMat);
    gl.uniform1i(s_texture, 0);
    gl.uniform1i(s_shadow, 1);
    gl.useProgram(null);

    return { mWovi, mProj, mWovil, mProjl, lightnorm, s_texture, s_shadow };
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

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);

    return texture;
  }

  protected vsSrc = `#version 300 es
    layout(location = 0) in vec3 a_position;
    layout(location = 1) in mediump vec3 a_normal;
    layout(location = 2) in ivec2 a_texture;
    layout(location = 3) in mediump vec3 a_colormask;

    uniform mat4 mWovi;
    uniform mat4 mProj;
    uniform mat4 mWovil;
    uniform mat4 mProjl;
    uniform vec3 lightnorm;

    out mediump vec2 v_texcoord1;
    out mediump vec2 v_texcoord2;
    out mediump float v_texinter;
    out mediump vec3 v_colormask;
    out mediump vec3 v_shadowcoord;

    const vec3 la = vec3(0.4, 0.4, 0.7);
    const vec3 lightColor = vec3(0.8, 0.8, 0.4);

    void main() {
      v_texcoord1.x = float(a_texture[0] >> 20 & 1023) / 128.;
      v_texcoord1.y = float(a_texture[0] >> 10 & 1023) / 128.;
      v_texcoord2.x = float(a_texture[0]       & 1023) / 128.;
      v_texcoord2.y = float(a_texture[1] >> 20 & 1023) / 128.;
      v_texinter = float(a_texture[1] >> 10 & 1023) / float(a_texture[1] & 1023);

      vec4 faceNorm = mWovi * vec4(a_normal, 0.0);
      vec4 lightNorm = mWovi * vec4(lightnorm, 0.0);
      vec3 lightIntensity = la + lightColor * max(dot(faceNorm, lightNorm), 0.0);
      v_colormask = a_colormask * lightIntensity;

      gl_Position = mProj * mWovi * vec4(a_position, 1.0);

      vec4 lightcoord = mProjl * mWovil * vec4(a_position, 1.0);
      v_shadowcoord = lightcoord.xyz / lightcoord.w;
      v_shadowcoord = v_shadowcoord * 0.5 + 0.5;
    }
  `;

  protected fsSrc = `#version 300 es
    precision mediump float;

    in mediump vec2 v_texcoord1;
    in mediump vec2 v_texcoord2;
    in mediump float v_texinter;
    in mediump vec3 v_colormask;
    in mediump vec3 v_shadowcoord;

    uniform sampler2D s_texture;
    uniform sampler2D s_shadow;

    out vec4 fragColor;

    void main() {
      vec4 texel1 = texture(s_texture, v_texcoord1);
      vec4 texel2 = texture(s_texture, v_texcoord2);
      vec4 texel  = texel1 * v_texinter + texel2 * (1. - v_texinter);
      if (texel.a < 0.1) discard;

      float depth = texture(s_shadow, v_shadowcoord.xy).r;
      float shadow = v_shadowcoord.z > depth ? 0. : 1.;

      fragColor = vec4(texel.rgb * v_colormask * shadow, texel.a);
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
  *               3 2         1         0         
  *               10987654321098765432109876543210
  * a_texture[0]: 00000000000000000000000000000000
  *                 └ tex1.x ┘└ tex1.y ┘└ tex2.x ┘
  * a_texture[1]: 00000000000000000000000000000000
  *                 └ tex2.y ┘└ inpo.d ┘└ inpo.n ┘
 */