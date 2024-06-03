import type { BlockType, ParticleOption, ParticleData } from "./types";
import type Engine from "./Engine";


/**
 * 代表一個粒子
 */
export class Particle {
  private engine: Engine;
  private x: number;
  private y: number;
  private z: number;

  private textureX1: number;
  private textureY1: number;
  private textureX2: number;
  private textureY2: number;

  private vx: number;
  private vy: number;
  private vz: number;

  private gravity = 0.05;

  private liveTime: number;
  private type: BlockType;
  private randomSize: number;

  constructor(options: ParticleOption) {
    this.engine = options.engine;
    this.x = options.x + Math.random();
    this.y = options.y + Math.random();
    this.z = options.z + Math.random();
    this.textureX1 = Math.random() * 12;
    this.textureY1 = Math.random() * 12;
    this.textureX2 = this.textureX1 + 4;
    this.textureY2 = this.textureY1 + 4;

    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = Math.random() * 0.2;
    this.vz = (Math.random() - 0.5) * 0.4;

    this.liveTime = Math.floor(Math.random() * 10) + 5;
    this.type = options.type;
    this.randomSize = (Math.random() - 0.5) * 0.2;
  }

  public update(): boolean {
    this.liveTime -= 1;
    if(this.liveTime === 0) return false;
    const xint = Math.floor(this.x), yint = Math.floor(this.y), zint = Math.floor(this.z);
    
    const block = this.engine.block(xint, yint, zint);
    if(block === null || block.type === 'air') {
      this.vy -= this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.z += this.vz;
    }
    return true;
  }

  public getData(): ParticleData {
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const textureX1 = this.textureX1;
    const textureY1 = this.textureY1;
    const textureX2 = this.textureX2;
    const textureY2 = this.textureY2;
    const type = this.type;
    const randomSize = this.randomSize

    return {x, y, z, textureX1, textureY1, textureX2, textureY2, type, randomSize};
  }
}


