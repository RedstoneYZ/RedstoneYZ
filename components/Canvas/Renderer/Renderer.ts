import Engine from "../Engine";
import Playground from "../Playground";
import { Vector3, Vector6 } from "../typings/types";

abstract class Renderer {
  public playground: Playground;
  public dimensions: Vector3;

  public engine: Engine;
  public canvas?: HTMLCanvasElement | OffscreenCanvas;
  public gl?: WebGLRenderingContext;

  abstract startRendering(): void;
  abstract getTarget(_canvasX: number, _canvasY: number): Vector6 | null;

  constructor(playground: Playground, dimensions: Vector3) {
    this.playground = playground;
    this.dimensions = dimensions;
    this.engine = playground.engine;
  }

  /**
   * 初始化
   */
  initialize(canvas: HTMLCanvasElement | OffscreenCanvas): void {
    this.canvas = canvas;
    this.startRendering();
  }

  /**
   * 生成一個 OpenGL 環境
   */
  protected _generateGl(): WebGLRenderingContext {
    if (!this.canvas) {
      throw new Error('The canvas has not been initialized.');
    }

    const gl = this.gl = this.canvas.getContext('webgl', { alpha: false }) ?? undefined;
    if (!gl) {
      throw new Error('Your browser does not support webgl canvas.');
    }

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    return gl;
  }

  /**
   * 生成一個著色程式
   */
  protected _generateProgram(gl: WebGLRenderingContext): WebGLProgram {
    const vertexShader = this._loadShader(gl, gl.VERTEX_SHADER, this._vertexShaderSource);
    const fragmentShader = this._loadShader(gl, gl.FRAGMENT_SHADER, this._fragmentShaderSource);
    return this._loadProgram(gl, vertexShader, fragmentShader);
  }

  /**
   * 設置緩衝區的內容
   */
  protected _setupBuffer(gl: WebGLRenderingContext, vertices: number[], indices: number[]): void {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  }

  /**
   * 載入指定類型的著色器
   */
  protected _loadShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error('Failed to create shader.');
    }

    gl.shaderSource(shader, source);

    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error('Shader Compilation Error\n' + gl.getShaderInfoLog(shader)?.toString());
    }
  
    return shader;
  }

  /**
   * 載入著色程式
   */
  protected _loadProgram(gl: WebGLRenderingContext, vShader: WebGLShader, fShader: WebGLShader): WebGLProgram {
    const program = gl.createProgram();
    if (!program) {
      throw new Error('Failed to create program.');
    }

    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Program Link Error\n' + gl.getProgramInfoLog(program)?.toString());
    }

    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
      throw new Error('Program Validate Error\n' + gl.getProgramInfoLog(program)?.toString());
    }

    gl.useProgram(program);
    return program;
  }

  protected get _worldMatrix(): Float32Array {
    const { theta, phi } = this.playground.angles;
    const c1 = Math.cos(theta), s1 = Math.sin(theta);
    const c2 = Math.cos(phi), s2 = Math.sin(phi);

    return new Float32Array([
       c1,  s1 * s2,  c2 * s1, 0, 
        0,       c2,      -s2, 0, 
      -s1,  c1 * s2,  c1 * c2, 0, 
        0,        0,        0, 1
    ]);
  }

  private __viewMatrix: Float32Array | null = null;
  protected get _viewMatrix() {
    if (this.__viewMatrix) return this.__viewMatrix;

    const a = 2.5 / Math.sqrt(Math.max(...this.dimensions));
    this.__viewMatrix = new Float32Array([
      a, 0, 0, 0, 
      0, a, 0, 0, 
      0, 0, a, 0, 
      0, 0, -15, 1
    ]);
    return this.__viewMatrix;
  }

  protected _projMatrix = new Float32Array([
    2.414,     0,    0,  0, 
        0, 2.414,    0,  0, 
        0,     0,   -1, -1, 
        0,     0, -0.2,  0
  ]);

  protected _vertexShaderSource = "";
  protected _fragmentShaderSource = "";
}

export default Renderer;