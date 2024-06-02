import type { BlockType, ParticleOption } from "./types";
import type Engine from "./Engine";


/**
 * 代表一個粒子
 */
export class Particle {
  public engine: Engine;
  public x: number;
  public y: number;
  public z: number;

  public textureX1: number;
  public textureY1: number;
  public textureX2: number;
  public textureY2: number;

  public vx: number;
  public vy: number;
  public vz: number;

  public gravity = 0.01;

  public liveTime: number;
  public type: BlockType;

  constructor(options: ParticleOption) {
    this.engine = options.engine;
    this.x = options.x;
    this.y = options.y;
    this.z = options.z;
    this.textureX1 = options.textureX1;
    this.textureY1 = options.textureY1;
    this.textureX2 = options.textureX2;
    this.textureY2 = options.textureY2;

    this.vx = options.vx;
    this.vy = options.vy;
    this.vz = options.vz;

    this.liveTime = options.liveTime;
    this.type = options.type;
  }

  public update(): boolean {
    this.liveTime -= 1;
    if(this.liveTime === 0) return false;
    this.vy -= this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;
    return true;
  }
}


