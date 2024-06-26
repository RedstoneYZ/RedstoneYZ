import type { Vector2, Vector3 } from "../model/types";
import type { PlayerFacing, PlayerXYZ } from "./types";

class Player {
  public xyz: PlayerXYZ;
  public facing: PlayerFacing;

  private speed: PlayerXYZ;
  private acc: number;
  private maxSpeed: number;
  private friction: number;

  constructor() {
    this.xyz = { x: 19, y: 7, z: 5 };
    this.facing = { yaw: Math.PI / 2, pitch: -0.5 };

    this.speed = { x: 0, y: 0, z: 0 };
    this.acc = 0.03125;
    this.maxSpeed = 0.125;
    this.friction = 0.875;
  }

  get xyzv(): Vector3 {
    return [this.xyz.x, this.xyz.y, this.xyz.z];
  }

  get facingNormal2(): Vector2 {
    const cy = Math.cos(-this.facing.yaw);
    const sy = Math.sin(-this.facing.yaw);
    return [sy, cy];
  }

  get facingNormal3(): Vector3 {
    const cy = Math.cos(-this.facing.yaw);
    const sy = Math.sin(-this.facing.yaw);
    const cp = Math.cos(-this.facing.pitch);
    const sp = Math.sin(-this.facing.pitch);
    return [sy * cp, -sp, cy * cp];
  }

  get velocity(): number {
    const { x, y, z } = this.speed;
    return Math.sqrt(x * x + y * y + z * z);
  }

  advance() {
    this.xyz.x += this.speed.x;
    this.xyz.y += this.speed.y;
    this.xyz.z += this.speed.z;

    this.speed.x *= this.friction;
    this.speed.y *= this.friction;
    this.speed.z *= this.friction;

    if (this.velocity < 1e-4) {
      this.speed.x = this.speed.y = this.speed.z = 0;
    }
  }

  moveForward() {
    const [dx, dz] = this.facingNormal2;
    this.move([dx, 0, dz]);
  }

  moveBackward() {
    const [dx, dz] = this.facingNormal2;
    this.move([-dx, 0, -dz]);
  }

  moveLeft() {
    const [dx, dz] = this.facingNormal2;
    this.move([dz, 0, -dx]);
  }

  moveRight() {
    const [dx, dz] = this.facingNormal2;
    this.move([-dz, 0, dx]);
  }

  moveUp() {
    this.move([0, 1, 0]);
  }

  moveDown() {
    this.move([0, -1, 0]);
  }

  private move([dx, dy, dz]: Vector3) {
    this.speed.x += dx * this.acc;
    this.speed.y += dy * this.acc;
    this.speed.z += dz * this.acc;

    const velocity = this.velocity;
    if (velocity > this.maxSpeed) {
      const factor = this.maxSpeed / velocity;
      this.speed.x *= factor;
      this.speed.y *= factor;
      this.speed.z *= factor;
    }
  }
}

export default Player;
