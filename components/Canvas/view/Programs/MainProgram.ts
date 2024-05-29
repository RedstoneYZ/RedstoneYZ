import type ProgramManager from "../ProgramManager";
import Program from "./Program";
import { glUnpacki, glUnpackif } from "./glImports";

interface Uniforms {
  u_mvp: WebGLUniformLocation;
  u_lightnorm: WebGLUniformLocation;
  s_texture: WebGLUniformLocation;
}

export default class FabulousProgram extends Program {
  protected program: WebGLProgram;

  private uniform: Uniforms;
  private abo: WebGLBuffer;
  private vao: WebGLVertexArrayObject;

  constructor(parent: ProgramManager, gl: WebGL2RenderingContext) {
    super(parent, gl);

    this.program = this.createProgram();
    this.uniform = this.setupUniform(["u_mvp", "u_lightnorm", "s_texture"]);
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
    gl.uniform3fv(this.uniform.u_lightnorm, this.getLightNorm());

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
    gl.vertexAttribIPointer(1, 1, gl.INT, 28, 12);
    gl.vertexAttribIPointer(2, 2, gl.INT, 28, 16);
    gl.vertexAttribIPointer(3, 1, gl.INT, 28, 24);

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.enableVertexAttribArray(3);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.parent.indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    return vao;
  }

  private getData(): Float32Array {
    const textures = this.parent.renderer.textures;
    const engine = this.parent.engine;
    const data: number[] = [];
    this.parent.renderer.pg.forEach((layer, x) => {
      layer.forEach((column, y) => {
        column.forEach(({ exposedFaces }, z) => {
          exposedFaces.forEach((face) => {
            const {
              corners: c,
              texCoord: t,
              tangent: [u, v],
              texture: tex,
            } = face;

            const offset = textures.sampleBlock(tex, engine.tick);
            const [ox1, oy1, ox2, oy2, oa, ob] = offset;

            const [tx, ty] = textures.sampleTint(engine.block(x, y, z)!);
            const tint = (tx << 10) | ty;

            const normal = [
              v[1] * u[2] - v[2] * u[1],
              v[2] * u[0] - v[0] * u[2],
              v[0] * u[1] - v[1] * u[0],
            ].map((a) => (a + 1) * 511);
            const norm = (normal[0] << 20) | (normal[1] << 10) | normal[2];

            for (let l = 0; l < 4; ++l) {
              const uOffset = t[l][0] > t[l ^ 2][0] ? 2 : 0;
              const vOffset = t[l][1] > t[l ^ 2][1] ? 1 : 0;
              const tex1 = ((t[l][0] + ox1) << 20) | ((t[l][1] + oy1) << 10) | (t[l][0] + ox2);
              const tex2 = ((t[l][1] + oy2) << 20) | (oa << 11) | (ob << 2) | uOffset | vOffset;

              data.push(c[l][0] + x, c[l][1] + y, c[l][2] + z, norm, tex1, tex2, tint);
            }
          });
        });
      });
    });

    const asFloat32 = new Float32Array(data);
    const asInt32 = new Int32Array(asFloat32.buffer);
    for (let i = 0; i < asFloat32.length; i += 7) {
      asInt32[i + 3] = data[i + 3];
      asInt32[i + 4] = data[i + 4];
      asInt32[i + 5] = data[i + 5];
      asInt32[i + 6] = data[i + 6];
    }
    return asFloat32;
  }

  protected vsSrc = `#version 300 es
    ${glUnpacki}
    ${glUnpackif}

    layout(location = 0) in vec3 a_position;
    layout(location = 1) in int a_normal;
    layout(location = 2) in ivec2 a_texture;
    layout(location = 3) in int a_tint;

    uniform mat4 u_mvp;
    uniform vec3 u_lightnorm;
    uniform sampler2D s_texture;

    out mediump vec2 v_texcoord1;
    out mediump vec2 v_texcoord2;
    flat out mediump float v_texinter;
    flat out mediump float v_suncosine;
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
      v_texcoord1.x += uOffset ? 0.0005 : -0.0005;
      v_texcoord2.x += uOffset ? 0.0005 : -0.0005;
      v_texcoord1.y += vOffset ? 0.0005 : -0.0005;
      v_texcoord2.y += vOffset ? 0.0005 : -0.0005;

      vec3 tangent;
      tangent.x = unpackif(a_normal, 20, 10) / 511. - 1.;
      tangent.y = unpackif(a_normal, 10, 10) / 511. - 1.;
      tangent.z = unpackif(a_normal,  0, 10) / 511. - 1.;
      v_suncosine = max(dot(tangent, u_lightnorm), 0.0);

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
    flat in mediump float v_texinter;
    flat in mediump float v_suncosine;
    flat in mediump vec3 v_tint;

    uniform sampler2D s_texture;

    out vec4 fragColor;

    const vec3 light_color = vec3(1.1, 1.1, 1.0);
    const vec3 ambient_color = vec3(0.8, 0.8, 1.0);

    void main() {
      vec4 texel1 = texture(s_texture, v_texcoord1);
      vec4 texel2 = texture(s_texture, v_texcoord2);
      vec4 texel  = texel1 * v_texinter + texel2 * (1. - v_texinter);
      if (texel.a < 0.1) discard;

      vec3 ambient = 0.5 * ambient_color;
      vec3 light = v_suncosine * light_color * (vec3(1, 1, 1) - ambient);
      fragColor = vec4(texel.rgb * v_tint * (ambient + light), texel.a);
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
