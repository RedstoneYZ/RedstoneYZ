import { BlockType } from "../../model/types";
import Renderer from "../Renderer";
import Program from "./Program";
import { glUnpackif } from "./glImports";

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

  constructor(renderer: Renderer, gl: WebGL2RenderingContext) {
    super(renderer, gl);

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

    gl.uniformMatrix4fv(this.uniform.u_mvp, false, this.renderer.mvp);
    gl.uniformMatrix4fv(this.uniform.u_mlp, false, this.renderer.mlp);
    gl.uniform3fv(this.uniform.lightnorm, this.getLightNorm());

    const data = this.getData();
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLE_FAN, (data.length / 32) * 5, gl.UNSIGNED_SHORT, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);

    return true;
  }

  private getLightNorm(): Float32Array {
    const theta = this.renderer.sunAngle;
    return new Float32Array([Math.cos(theta), Math.sin(theta), 0]);
  }

  protected override setupUniform<T extends string>(uniforms: T[]): Uniforms {
    const uniform = super.setupUniform(uniforms) as Uniforms;
    const gl = this.gl;

    gl.useProgram(this.program);
    gl.uniform2iv(uniform.screensize, [this.renderer.WIDTH, this.renderer.HEIGHT]);
    gl.uniform1i(uniform.s_texture, 0);
    gl.uniform1i(uniform.s_shadow, 1);
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
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
    gl.vertexAttribIPointer(2, 2, gl.INT, 32, 24);

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.renderer.indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    return vao;
  }

  private getData(): Float32Array {
    // TODO: only update block changes
    const vertices: number[] = [];
    for (let x = 0; x < this.renderer.dimensions[0]; x++) {
      for (let y = 0; y < this.renderer.dimensions[1]; y++) {
        for (let z = 0; z < this.renderer.dimensions[2]; z++) {
          const block = this.renderer.engine.block(x, y, z);
          if (!block || block.type === BlockType.AirBlock) continue;

          const models = this.renderer.models.get(block.type, block.states);
          models.forEach((model) => {
            model.faces.forEach((face) => {
              if (!this.renderer.shouldRender(block, face)) return;

              const { corners: c, texCoord: t, normal: n } = face;
              const offset = this.renderer.textures.sample(face.texture, this.renderer.engine.tick);
              const [ox1, oy1, ox2, oy2, oa, ob] = offset;

              for (let l = 0; l < 4; ++l) {
                const tex1 = ((t[l][0] + ox1) << 20) | ((t[l][1] + oy1) << 10) | (t[l][0] + ox2);
                const tex2 = ((t[l][1] + oy2) << 20) | (oa << 10) | ob;

                vertices.push(c[l][0] + x, c[l][1] + y, c[l][2] + z, n[0], n[1], n[2], tex1, tex2);
              }
            });
          });
        }
      }
    }

    const asFloat32 = new Float32Array(vertices);
    const asInt32 = new Int32Array(asFloat32.buffer);
    for (let i = 0; i < asFloat32.length; i += 8) {
      asInt32[i + 6] = vertices[i + 6];
      asInt32[i + 7] = vertices[i + 7];
    }

    return asFloat32;
  }

  private async createSprite(): Promise<WebGLTexture> {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error("Failed to create main texture.");
    }

    const atlas = await new Promise<HTMLImageElement>((res) => {
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
    ${glUnpackif}

    layout(location = 0) in vec3 a_position;
    layout(location = 1) in mediump vec3 a_normal;
    layout(location = 2) in ivec2 a_texture;

    uniform mat4 u_mvp;
    uniform mat4 u_mlp;
    uniform vec3 lightnorm;

    out mediump vec2 v_texcoord1;
    out mediump vec2 v_texcoord2;
    out mediump float v_texinter;
    out mediump float v_suncosine;
    out mediump vec3 v_shadowcoord;

    const vec3 la = vec3(0.1, 0.1, 0.2);

    void main() {
      gl_Position = u_mvp * vec4(a_position, 1.0);

      v_texcoord1.x = unpackif(a_texture.s, 20, 10) / 128.;
      v_texcoord1.y = unpackif(a_texture.s, 10, 10) / 128.;
      v_texcoord2.x = unpackif(a_texture.s,  0, 10) / 128.;
      v_texcoord2.y = unpackif(a_texture.t, 20, 10) / 128.;
      v_texinter = unpackif(a_texture.t, 10, 10) / unpackif(a_texture.t, 0, 10);

      v_suncosine = max(dot(a_normal, lightnorm), 0.0);

      vec4 lightcoord = u_mlp * vec4(a_position, 1.0);
      v_shadowcoord = lightcoord.xyz / lightcoord.w;
      v_shadowcoord = v_shadowcoord * 0.5 + 0.5;
    }
  `;

  protected fsSrc = `#version 300 es
    precision mediump float;

    in mediump vec2 v_texcoord1;
    in mediump vec2 v_texcoord2;
    in mediump float v_texinter;
    in mediump float v_suncosine;
    in mediump vec3 v_shadowcoord;

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
      fragColor = vec4(texel.rgb * factor, texel.a);
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
 *                └ tex2.y ┘└ inpo.d ┘└ inpo.n ┘
 */
