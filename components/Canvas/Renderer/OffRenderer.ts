import Playground from "../Playground";
import { Vector3, Vector6 } from "../typings/types";
import DisplayRenderer from "./DisplayRenderer";
import Renderer from "./Renderer";

class OffRenderer extends Renderer {
  public mainRenderer: DisplayRenderer;

  constructor(playground: Playground, dimensions: Vector3, mainRenderer: DisplayRenderer) {
    super(playground, dimensions);

    this.mainRenderer = mainRenderer;
  }

  startRendering(): void {
    if (!this.canvas) {
      throw new Error('The canvas has not been initialized.');
    }

    const gl = this._generateGl();
    const program = this._generateProgram(gl);

    const matViewUniformLocation = gl.getUniformLocation(program, 'mView');
    const matProjUniformLocation = gl.getUniformLocation(program, 'mProj');
    const matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');

    gl.uniformMatrix4fv(matViewUniformLocation, false, this._viewMatrix);
    gl.uniformMatrix4fv(matProjUniformLocation, false, this._projMatrix);


    const positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    const surfaceAttribLocation = gl.getAttribLocation(program, 'surfaceInfo');
    
    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(surfaceAttribLocation);
    
    let vertices;
    const draw = () => {
      gl.uniformMatrix4fv(matWorldUniformLocation, false, this._worldMatrix);

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      
      vertices = this._getBlockVertices();
      this._setupBuffer(gl, vertices, this.mainRenderer.indices);

      gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0);
      gl.vertexAttribPointer(surfaceAttribLocation, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);

      gl.drawElements(gl.TRIANGLES, vertices.length >> 2, gl.UNSIGNED_SHORT, 0);

      if (this.playground.alive) {
        requestAnimationFrame(draw);
      }
    }

    requestAnimationFrame(draw);
  }

  getTarget(canvasX: number, canvasY: number): Vector6 | null {
    if (!this.gl) return null;
    
    const repCode = new Uint8Array(4);
    this.gl.readPixels(canvasX, 500-canvasY, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, repCode);

    if (!repCode[0] && !repCode[1] && !repCode[2]) return null;

    repCode[0] -= 128;
    repCode[1] -= 128;
    repCode[2] -= 128;

    return [
      repCode[0] >> 3, 
      repCode[1] >> 3, 
      repCode[2] >> 3, 
      ((repCode[0] & 7) >> 1) - 1, 
      ((repCode[1] & 7) >> 1) - 1, 
      ((repCode[2] & 7) >> 1) - 1
    ];
  }

  _getBlockVertices(): number[] {
    const result: number[] = [];
    for (let i = 0; i < this.dimensions[0]; i++) {
      for (let j = 0; j < this.dimensions[1]; j++) {
        for (let k = 0; k < this.dimensions[2]; k++) {
          const block = this.engine.block(i, j, k);
          if (!block?.outlines) continue;

          const x = i - this.dimensions[0] / 2;
          const y = j - this.dimensions[1] / 2;
          const z = k - this.dimensions[2] / 2;

          result.push(...block.outlines.map((v, n) => {
            n %= 6;
            return n < 3 ? v + [x, y, z][n] : (([i, j, k][n - 3] << 3) | ((v + 1) << 1)) + 128;
          }));
        }
      }  
    }
    return result;
  }

  _vertexShaderSource = `
    precision mediump float;
    
    attribute vec3 vertPosition;
    attribute vec3 surfaceInfo;
    uniform mat4 mWorld;
    uniform mat4 mView;
    uniform mat4 mProj;
    varying vec3 fragSurface;

    void main() {
      fragSurface = surfaceInfo;
      gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);
    }
  `;

  _fragmentShaderSource = `
    precision mediump float;

    varying vec3 fragSurface;

    void main() {
      gl_FragColor = vec4(fragSurface.x / 255.0, fragSurface.y / 255.0, fragSurface.z / 255.0, 1.0);
    }
  `;
}

export default OffRenderer;