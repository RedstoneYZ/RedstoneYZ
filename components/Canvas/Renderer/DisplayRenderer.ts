import Controller from "../controllers/Controller";
import { Block } from "../core";
import { Maps } from "../core/utils";
import { BlockType, SixSides, Vector3, Vector6 } from "../typings/types";
import OffRenderer from "./OffRenderer";
import Renderer from "./Renderer";

class DisplayRenderer extends Renderer {
  public images: Map<string, HTMLImageElement>;
  public indices: number[];
  
  private _devMode: boolean;
  private _offRenderer: OffRenderer;

  constructor(controller: Controller, dimensions: Vector3) {
    super(controller, dimensions);

    this.images = new Map();
    this.indices = Array.from(
      { length: 8192 }, 
      (_, i) => {
        i <<= 2;
        return [i, i + 1, i + 2, i, i + 2, i + 3];
      }
    ).flat();

    this._devMode = false;
    this._offRenderer = new OffRenderer(controller, dimensions, this);
  }

  initialize(canvas: HTMLCanvasElement): void {
    ['iron_block', 'comparator', 'comparator_on', 'cobblestone', 'lever_on', 'lever', 'redstone_dust_dot', 'redstone_dust_line0', 'redstone_dust_line1', 'redstone_dust_overlay', 'redstone_lamp', 'redstone_lamp_on', 'glass', 'repeater', 'smooth_stone', 'repeater_on', 'redstone_torch', 'redstone_torch_off', 'bedrock', 'target_top', 'target_side'].forEach(src => {
      const image = new Image();
      image.src = `/static/images/textures/${src}.png`;
      this.images.set(src, image);
    });

    if (this._devMode) {
      super.initialize(new OffscreenCanvas(canvas.width, canvas.height));
      this._offRenderer.initialize(canvas);
    }
    else {
      super.initialize(canvas);
      this._offRenderer.initialize(new OffscreenCanvas(canvas.width, canvas.height));
    }
  }

  startRendering(): void {
    if (!this.canvas) {
      throw new Error('The canvas has not been initialized.');
    }

    const gl = this._generateGl();
    const program = this._generateProgram(gl);

    const boxTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, boxTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.activeTexture(gl.TEXTURE0);


    const matViewUniformLocation = gl.getUniformLocation(program, 'mView');
    const matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

    gl.uniformMatrix4fv(matViewUniformLocation, false, this._viewMatrix);
    gl.uniformMatrix4fv(matProjUniformLocation, false, this._projMatrix);

    const ambientUniformLocation = gl.getUniformLocation(program, 'ambientIntensity');
    const lightColorUniformLocation = gl.getUniformLocation(program, 'lightColor');
    const lightDirectionUniformLocation = gl.getUniformLocation(program, 'lightDirection');
    const matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');

    gl.uniform3f(ambientUniformLocation, 0.4, 0.4, 0.7);
    gl.uniform3f(lightColorUniformLocation, 0.8, 0.8, 0.4);
    gl.uniform3f(lightDirectionUniformLocation, 1.0, 2.0, 3.0);


    const positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    const texCoordAttribLocation = gl.getAttribLocation(program, 'vertTexCoord');
    const normalAttribLocation = gl.getAttribLocation(program, 'vertNormal');
    const colorMaskAttribLocation = gl.getAttribLocation(program, 'vertColorMask');
      
    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(texCoordAttribLocation);
    gl.enableVertexAttribArray(normalAttribLocation);
    gl.enableVertexAttribArray(colorMaskAttribLocation);
    
    const draw = () => {
      if (this._needRender) {
        gl.uniformMatrix4fv(matWorldUniformLocation, false, this._worldMatrix);

        gl.clearColor(1, 0.96, 0.66, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
        for (const [image, { vertices }] of this._getBlockVertices()) {
          this._setupBuffer(gl, vertices, this.indices);
      
          gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, false, 11 * Float32Array.BYTES_PER_ELEMENT, 0);
          gl.vertexAttribPointer(texCoordAttribLocation, 2, gl.FLOAT, false, 11 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
          gl.vertexAttribPointer(normalAttribLocation, 3, gl.FLOAT, true, 11 * Float32Array.BYTES_PER_ELEMENT, 5 * Float32Array.BYTES_PER_ELEMENT);
          gl.vertexAttribPointer(colorMaskAttribLocation, 3, gl.FLOAT, false, 11 * Float32Array.BYTES_PER_ELEMENT, 8 * Float32Array.BYTES_PER_ELEMENT);
          
          const img = this.images.get(image);
          if (img) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.drawElements(gl.TRIANGLES, vertices.length / 22 * 3, gl.UNSIGNED_SHORT, 0);
          }
        }

        this._resetNeedRender();
      }

      if (this.controller.alive) {
        requestAnimationFrame(draw);
      }
    }

    requestAnimationFrame(draw);
  }

  getTarget(canvasX: number, canvasY: number): Vector6 | null {
    return this._offRenderer.getTarget(canvasX, canvasY);
  }

  private _getBlockVertices(): Map<string, { vertices: number[], counter: number }> {
    const map = new Map();
    for (let i = 0; i < this.dimensions[0]; i++) {
      for (let j = 0; j < this.dimensions[1]; j++) {
        for (let k = 0; k < this.dimensions[2]; k++) {
          const block = this.engine.block(i, j, k);
          if (!block?.textures) continue;

          const x = i - this.dimensions[0] / 2;
          const y = j - this.dimensions[1] / 2;
          const z = k - this.dimensions[2] / 2;
          const color = 'color' in block ? block.color.map(a => a / 255) : [1, 1, 1];

          block.textures.forEach(texture => {
            for (const [dirName, data] of Object.entries(texture)) {
              if (!data || !this._shouldRender(block, dirName as SixSides)) continue;
              
              let storage = map.get(data.source);
              if (!storage) {
                storage = { vertices: [], counter: 0 };
                map.set(data.source, storage);
              }

              const v = data.vertices;
              for (let i = 0; i < v.length; i += 8) {
                storage.vertices.push(
                  v[i] + x, 
                  v[i+1] + y, 
                  v[i+2] + z, 
                  v[i+3], 
                  v[i+4], 
                  v[i+5], 
                  v[i+6], 
                  v[i+7], 
                  ...color
                );
              }
              storage.counter++;
            }
          });
        }
      }  
    }
    return map;
  }

  private _shouldRender(block: Block, dir: SixSides) {
    if (block.type !== BlockType.IronBlock && block.type !== BlockType.GlassBlock) return true;

    const [x, y, z] = Maps.P6DMap[dir];
    const adjacentBlock = this.engine.block(block.x + x, block.y + y, block.z + z);
    if (!adjacentBlock) return true;

    if (block.type === BlockType.GlassBlock) return !adjacentBlock.fullBlock;
    return !adjacentBlock.fullBlock || adjacentBlock.type === BlockType.AirBlock || adjacentBlock.type === BlockType.GlassBlock;
  }

  get _needRender() {
    return this.controller.needRender || this.engine.needRender;
  }

  _resetNeedRender() {
    this.controller.needRender = false;
    this.engine.needRender = false;
  }

  _vertexShaderSource = `
    precision mediump float;
    
    attribute vec3 vertPosition;
    attribute vec2 vertTexCoord;
    attribute vec3 vertNormal;
    attribute vec3 vertColorMask;
    uniform mat4 mWorld;
    uniform mat4 mView;
    uniform mat4 mProj;
    varying vec2 fragTexCoord;
    varying vec3 fragNormal;
    varying vec3 fragColorMask;

    void main() {
      fragTexCoord = vertTexCoord;
      fragColorMask = vertColorMask;
      fragNormal = (mWorld * vec4(vertNormal, 0.0)).xyz;
      gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);
    }
  `;

  _fragmentShaderSource = `
    precision mediump float;

    uniform sampler2D sampler;
    uniform vec3 ambientIntensity;
    uniform vec3 lightColor;
    uniform vec3 lightDirection;
    varying vec2 fragTexCoord;
    varying vec3 fragNormal;
    varying vec3 fragColorMask;

    void main() {
      vec4 texel = texture2D(sampler, fragTexCoord);
      vec3 lightIntensity = ambientIntensity + lightColor * max(dot(normalize(fragNormal), normalize(lightDirection)), 0.0);

      gl_FragColor = vec4(texel.rgb * fragColorMask * lightIntensity, texel.a);
      if (gl_FragColor.a < 0.1) discard;
    }
  `;
}

export default DisplayRenderer;