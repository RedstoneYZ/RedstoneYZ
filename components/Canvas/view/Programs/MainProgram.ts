import type ProgramManager from "../ProgramManager";
import type { DataProcessor } from "../ProgramManager";
import Program from "./Program";
import { glUnpacki, glUnpackif } from "./glImports";

interface Uniforms {
  u_mvp: WebGLUniformLocation;
  u_mlp: WebGLUniformLocation;
  lightnorm: WebGLUniformLocation;
  s_texture: WebGLUniformLocation;
  s_shadow: WebGLUniformLocation;
  screensize: WebGLUniformLocation;
}

export default class MainProgram extends Program {
  protected program: WebGLProgram;

  private uniform: Uniforms;
  private abo: WebGLBuffer;
  private vao: WebGLVertexArrayObject;

  constructor(parent: ProgramManager, gl: WebGL2RenderingContext) {
    super(parent, gl);

    this.program = this.createProgram();
    this.uniform = this.setupUniform([
      "u_mvp",
      "u_mlp",
      "lightnorm",
      "s_texture",
      "s_shadow",
      "screensize",
    ]);
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
    gl.uniformMatrix4fv(this.uniform.u_mlp, false, this.parent.mlp);
    gl.uniform3fv(this.uniform.lightnorm, this.getLightNorm());

    const rawData = this.parent.getData(this.processRaw);
    const data = this.processData(rawData);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLE_FAN, (data.length / 36) * 5, gl.UNSIGNED_SHORT, 0);

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
    gl.uniform2iv(uniform.screensize, [this.parent.renderer.canvasW, this.parent.renderer.canvasH]);
    gl.uniform1i(uniform.s_shadow, 0);
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

    // TODO: maybe change normal and texcoords to half float
    // COMMENT: wait for https://github.com/tc39/proposal-float16array
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 36, 12);
    gl.vertexAttribIPointer(2, 2, gl.INT, 36, 24);
    gl.vertexAttribIPointer(3, 1, gl.INT, 36, 32);

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.enableVertexAttribArray(3);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.parent.indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    return vao;
  }

  private processRaw: DataProcessor<number> = function (_c, engine, renderer, block, data) {
    const models = renderer.models.get(block.type, block.states);
    models.forEach((model) => {
      model.faces.forEach((face) => {
        if (!renderer.shouldRender(block, face)) return;

        const { corners: c, texCoord: t, normal: n, texture: tex } = face;
        const offset = renderer.textures.sampleBlock(tex, engine.tick);
        const [tx, ty] = renderer.textures.sampleTint(block);
        const [ox1, oy1, ox2, oy2, oa, ob] = offset;

        for (let l = 0; l < 4; ++l) {
          const uOffset = t[l][0] > t[l ^ 2][0] ? 2 : 0;
          const vOffset = t[l][1] > t[l ^ 2][1] ? 1 : 0;
          const tex1 = ((t[l][0] + ox1) << 20) | ((t[l][1] + oy1) << 10) | (t[l][0] + ox2);
          const tex2 = ((t[l][1] + oy2) << 20) | (oa << 11) | (ob << 2) | uOffset | vOffset;
          const tint = (tx << 10) | ty;

          data.push(
            c[l][0] + block.x,
            c[l][1] + block.y,
            c[l][2] + block.z,
            n[0],
            n[1],
            n[2],
            tex1,
            tex2,
            tint,
          );
        }
      });
    });
  };

  private processData(data: number[]): Float32Array {
    const asFloat32 = new Float32Array(data);
    const asInt32 = new Int32Array(asFloat32.buffer);
    for (let i = 0; i < asFloat32.length; i += 9) {
      asInt32[i + 6] = data[i + 6];
      asInt32[i + 7] = data[i + 7];
      asInt32[i + 8] = data[i + 8];
    }
    return asFloat32;
  }

  protected vsSrc = `#version 300 es
    ${glUnpacki}
    ${glUnpackif}

    layout(location = 0) in vec3 a_position;
    layout(location = 1) in mediump vec3 a_normal;
    layout(location = 2) in ivec2 a_texture;
    layout(location = 3) in int a_tint;

    uniform mat4 u_mvp;
    uniform mat4 u_mlp;
    uniform vec3 lightnorm;
    uniform sampler2D s_texture;

    out mediump vec2 v_texcoord1;
    out mediump vec2 v_texcoord2;
    out mediump float v_texinter;
    out mediump float v_suncosine;
    out mediump vec3 v_shadowcoord;
    flat out mediump vec3 v_tint;

    const vec3 la = vec3(0.1, 0.1, 0.2);

    void main() {
      gl_Position = u_mvp * vec4(a_position, 1.0);

      v_texcoord1.x = unpackif(a_texture.s, 20, 10) / 256.;
      v_texcoord1.y = unpackif(a_texture.s, 10, 10) / 256.;
      v_texcoord2.x = unpackif(a_texture.s,  0, 10) / 256.;
      v_texcoord2.y = unpackif(a_texture.t, 20, 10) / 256.;
      v_texinter = unpackif(a_texture.t, 11, 9) / unpackif(a_texture.t, 2, 9);

      bool uOffset = unpacki(a_texture.t, 1, 1) == 0;
      bool vOffset = unpacki(a_texture.t, 0, 1) == 0;
      v_texcoord1.x += uOffset ? 0.001 : -0.001;
      v_texcoord2.x += uOffset ? 0.001 : -0.001;
      v_texcoord1.y += vOffset ? 0.001 : -0.001;
      v_texcoord2.y += vOffset ? 0.001 : -0.001;

      v_suncosine = max(dot(a_normal, lightnorm), 0.0);

      vec4 lightcoord = u_mlp * vec4(a_position, 1.0);
      v_shadowcoord = lightcoord.xyz / lightcoord.w;
      v_shadowcoord = v_shadowcoord * 0.5 + 0.5;

      vec2 tint;
      tint.x = (unpackif(a_tint, 10, 10) + 0.5) / 256.;
      tint.y = (unpackif(a_tint,  0, 10) + 0.5) / 256.;
      v_tint = texture(s_texture, tint).rgb;
    }
  `;

  protected fsSrc = `#version 300 es
    precision mediump float;

    in mediump vec2 v_texcoord1;
    in mediump vec2 v_texcoord2;
    in mediump float v_texinter;
    in mediump float v_suncosine;
    in mediump vec3 v_shadowcoord;
    flat in mediump vec3 v_tint;

    uniform highp vec3 lightnorm;
    uniform ivec2 screensize;

    uniform sampler2D s_texture;
    uniform sampler2D s_shadow;

    out vec4 fragColor;

    const vec3 light_color = vec3(1.1, 1.1, 1.0);
    const vec3 ambient_color = vec3(0.8, 0.8, 1.0);

    void main() {
      vec4 texel1 = texture(s_texture, v_texcoord1);
      vec4 texel2 = texture(s_texture, v_texcoord2);
      vec4 texel  = texel1 * v_texinter + texel2 * (1. - v_texinter);
      if (texel.a < 0.1) discard;

      vec2 size = 1. / vec2(screensize);

      float shadow = 0.;
      for (int x = -1; x <= 1; ++x) {
        for (int y = -1; y <= 1; ++y) {
          vec2 xy = v_shadowcoord.xy + vec2(x, y) * size;
          float depth = texture(s_shadow, xy).r;
          shadow += v_shadowcoord.z > depth ? 0.3 : 1.0;
        }
      }
      shadow *= 0.11;

      vec3 factor = max(v_suncosine * shadow * light_color, 0.25 * ambient_color);
      fragColor = vec4(texel.rgb * v_tint * factor, texel.a);
    }
  `;
}

/**
 * a_texture format (ivec2)
 *              3 2         1         0
 *              10987654321098765432109876543210
 * a_texture.s: 00000000000000000000000000000000
 *                └ tex1.x ┘└ tex1.y ┘└ tex2.x ┘
 * a_texture.t: 00000000000000000000000000000000
 *                └ tex2.y ┘└ int.d ┘└ int.n ┘uv
 *           u: u offset in (0) / out (1)
 *           v: v offset in (0) / out (1)
 */
