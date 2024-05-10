import Controller from "../controller/Controller";
import Engine from "../model/Engine";
import { BlockType, Blocks } from "../model/types";
import EnvironmentProgram from "./Programs/EnvironmentProgram";
import LightProgram from "./Programs/LightProgram";
import LineProgram from "./Programs/LineProgram";
import MainProgram from "./Programs/MainProgram";
import type Program from "./Programs/Program";
import type Renderer from "./Renderer";
import Matrix4 from "./utils/Matrix4";

export default class ProgramManager {
  public controller: Controller;
  public engine: Engine;
  public renderer: Renderer;
  private gl: WebGL2RenderingContext;
  private programs: Program[];

  constructor(renderer: Renderer, canvas: HTMLCanvasElement) {
    this.controller = renderer.controller;
    this.engine = renderer.engine;
    this.renderer = renderer;
    
    this.gl = this.initGL(canvas);
    this.programs = [
      new LightProgram(this, this.gl),
      // new TestProgram(this, this.gl),
      new MainProgram(this, this.gl),
      new EnvironmentProgram(this, this.gl),
      new LineProgram(this, this.gl),
    ];
  }

  public draw(): boolean {
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
    const tick = this.engine.tick % 24000;
    return (tick * Math.PI) / 12000;
  }

  public get seasonAngle(): number {
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