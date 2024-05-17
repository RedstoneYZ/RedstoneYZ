import type Controller from "../controller/Controller";
import type Engine from "../model/Engine";
import type { Blocks } from "../model/types";
import { BlockType } from "../model/types";
import EnvironmentProgram from "./Programs/EnvironmentProgram";
import LightProgram from "./Programs/LightProgram";
import LineProgram from "./Programs/LineProgram";
import MainProgram from "./Programs/MainProgram";
import HotBarProgram from "./Programs/HotBarProgram";
import type Program from "./Programs/Program";
import type Renderer from "./Renderer";
import Matrix4 from "./utils/Matrix4";

export default class ProgramManager {
  public controller: Controller;
  public engine: Engine;
  public renderer: Renderer;
  public textures: WebGLTexture[];
  private gl: WebGL2RenderingContext;
  private programs: Program[];
  private ready: boolean;

  constructor(renderer: Renderer, canvas: HTMLCanvasElement) {
    this.controller = renderer.controller;
    this.engine = renderer.engine;
    this.renderer = renderer;

    this.gl = this.initGL(canvas);

    this.createTextures().then((textures) => {
      this.textures = textures;
      this.programs = [
        new LightProgram(this, this.gl),
        // new TestProgram(this, this.gl),
        new MainProgram(this, this.gl),
        new EnvironmentProgram(this, this.gl),
        new LineProgram(this, this.gl),
        new HotBarProgram(this, this.gl),
      ];
      this.ready = true;
    });
  }

  public draw(): boolean {
    if (!this.ready) return false;

    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let allSuccess = true;
    for (const program of this.programs) {
      const success = program.draw();
      allSuccess &&= success;
    }

    return allSuccess;
  }

  private initGL(canvas: HTMLCanvasElement): WebGL2RenderingContext {
    const gl = canvas.getContext("webgl2", { alpha: false });
    if (!gl) {
      throw new Error("Your browser does not support webgl2 canvas.");
    }

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(0.5, 0.63, 1, 1);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(2, 20);

    return gl;
  }

  private async createTextures(): Promise<WebGLTexture[]> {
    const gl = this.gl;

    const texture0 = gl.createTexture();
    if (!texture0) {
      throw new Error("Failed to create main texture.");
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    gl.texStorage2D(
      gl.TEXTURE_2D,
      1,
      gl.DEPTH_COMPONENT16,
      this.renderer.canvasW,
      this.renderer.canvasH,
    );

    const texture1 = gl.createTexture();
    if (!texture1) {
      throw new Error("Failed to create main texture.");
    }

    const atlas = await new Promise<HTMLImageElement>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.src = "/images/atlas/atlas.png";
    });

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);

    const texture2 = gl.createTexture();
    if (!texture2) {
      throw new Error("Failed to create main texture.");
    }

    const sun = await new Promise<HTMLImageElement>((res) => {
      const image = new Image();
      image.onload = () => res(image);
      image.src = "/images/textures/environment/sun.png";
    });

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sun);

    return [texture0, texture1, texture2];
  }

  public getData<T>(func: DataProcessor<T>): T[] {
    const data: T[] = [];
    for (let x = 0; x < this.engine.xLen; x++) {
      for (let y = 0; y < this.engine.yLen; y++) {
        for (let z = 0; z < this.engine.zLen; z++) {
          const block = this.engine.block(x, y, z);
          if (!block || block.type === BlockType.AirBlock) continue;
          func(this.controller, this.engine, this.renderer, block, data);
        }
      }
    }
    return data;
  }

  public get sunAngle(): number {
    // return Math.PI / 3.5;
    const tick = this.engine.tick % 24000;
    return (tick * Math.PI) / 12000;
  }

  public get seasonAngle(): number {
    // return 0;
    const tick = this.engine.tick % (24000 * 96);
    return (tick * Math.PI) / (24000 * 48);
  }

  public get mvp(): Float32Array {
    const {
      xyz: { x, y, z },
      facing: { yaw, pitch },
    } = this.renderer.controller.player;

    return Matrix4.Multiply(
      Matrix4.Translate(-x, -y, -z),
      Matrix4.RotateY(yaw - Math.PI),
      Matrix4.RotateX(-pitch),
      Matrix4.Perspective(0.2 * this.renderer.scaleX, 0.2 * this.renderer.scaleY, 0.1, 100),
    );
  }

  public get mlp(): Float32Array {
    const theta = this.sunAngle;
    const phi = this.seasonAngle;
    const x = this.renderer.scaleX;
    const y = this.renderer.scaleY;

    return Matrix4.Multiply(
      Matrix4.RotateY(-Math.PI / 2),
      Matrix4.RotateZ((-25.04 * Math.PI) / 180),
      Matrix4.RotateX(theta),
      Matrix4.RotateY((-23.4 * Math.sin(phi) * Math.PI) / 180),
      Matrix4.Orthographic(-7 * x, 7 * x, -7 * y, 7 * y, -10, 10),
    );
  }

  public indices = new Uint16Array(
    Array.from({ length: 4096 }, (_, i) => {
      i <<= 2;
      return [i, i + 1, i + 2, i + 3, 65535];
    }).flat(),
  );

  public get mvInv(): Float32Array {
    const {
      xyz: { x, y, z },
      facing: { yaw, pitch },
    } = this.renderer.controller.player;
    return Matrix4.Multiply(
      Matrix4.RotateX(pitch),
      Matrix4.RotateY(Math.PI - yaw),
      Matrix4.Translate(x, y, z),
    );
  }
}

export type DataProcessor<T> = (c: Controller, e: Engine, r: Renderer, b: Blocks, d: T[]) => void;
