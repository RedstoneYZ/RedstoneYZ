import { Vector4 } from "../../model/types";

export default class Matrix4 {
  static Identity() {
    const a = new Float32Array(16);

    a[0] = 1;
    a[1] = 0;
    a[2] = 0;
    a[3] = 0;
    a[4] = 0;
    a[5] = 1;
    a[6] = 0;
    a[7] = 0;
    a[8] = 0;
    a[9] = 0;
    a[10] = 1;
    a[11] = 0;
    a[12] = 0;
    a[13] = 0;
    a[14] = 0;
    a[15] = 1;

    return a;
  }

  static Translate(x: number, y: number, z: number) {
    const a = new Float32Array(16);

    a[0] = 1;
    a[1] = 0;
    a[2] = 0;
    a[3] = 0;
    a[4] = 0;
    a[5] = 1;
    a[6] = 0;
    a[7] = 0;
    a[8] = 0;
    a[9] = 0;
    a[10] = 1;
    a[11] = 0;
    a[12] = x;
    a[13] = y;
    a[14] = z;
    a[15] = 1;

    return a;
  }

  static RotateX(theta: number) {
    const c = cos(theta);
    const s = sin(theta);
    const a = new Float32Array(16);

    a[0] = 1;
    a[1] = 0;
    a[2] = 0;
    a[3] = 0;
    a[4] = 0;
    a[5] = c;
    a[6] = s;
    a[7] = 0;
    a[8] = 0;
    a[9] = -s;
    a[10] = c;
    a[11] = 0;
    a[12] = 0;
    a[13] = 0;
    a[14] = 0;
    a[15] = 1;

    return a;
  }

  static RotateY(theta: number) {
    const c = cos(theta);
    const s = sin(theta);
    const a = new Float32Array(16);

    a[0] = c;
    a[1] = 0;
    a[2] = -s;
    a[3] = 0;
    a[4] = 0;
    a[5] = 1;
    a[6] = 0;
    a[7] = 0;
    a[8] = s;
    a[9] = 0;
    a[10] = c;
    a[11] = 0;
    a[12] = 0;
    a[13] = 0;
    a[14] = 0;
    a[15] = 1;

    return a;
  }

  static RotateZ(theta: number) {
    const c = cos(theta);
    const s = sin(theta);
    const a = new Float32Array(16);

    a[0] = c;
    a[1] = s;
    a[2] = 0;
    a[3] = 0;
    a[4] = -s;
    a[5] = c;
    a[6] = 0;
    a[7] = 0;
    a[8] = 0;
    a[9] = 0;
    a[10] = 1;
    a[11] = 0;
    a[12] = 0;
    a[13] = 0;
    a[14] = 0;
    a[15] = 1;

    return a;
  }

  static Perspective(w: number, h: number, n: number, f: number) {
    const a = new Float32Array(16);

    a[0] = (2 * n) / w;
    a[1] = 0;
    a[2] = 0;
    a[3] = 0;
    a[4] = 0;
    a[5] = (2 * n) / h;
    a[6] = 0;
    a[7] = 0;
    a[8] = 0;
    a[9] = 0;
    a[10] = (n + f) / (n - f);
    a[11] = -1;
    a[12] = 0;
    a[13] = 0;
    a[14] = (2 * f * n) / (n - f);
    a[15] = 0;

    return a;
  }

  static Orthographic(l: number, r: number, b: number, t: number, n: number, f: number) {
    const a = new Float32Array(16);

    a[0] = 2 / (r - l);
    a[1] = 0;
    a[2] = 0;
    a[3] = 0;
    a[4] = 0;
    a[5] = 2 / (t - b);
    a[6] = 0;
    a[7] = 0;
    a[8] = 0;
    a[9] = 0;
    a[10] = 2 / (n - f);
    a[11] = 0;
    a[12] = (l + r) / (l - r);
    a[13] = (b + t) / (b - t);
    a[14] = (n + f) / (n - f);
    a[15] = 1;

    return a;
  }

  static Copy(a: Float32Array, b: Float32Array) {
    a[0] = b[0];
    a[1] = b[1];
    a[2] = b[2];
    a[3] = b[3];
    a[4] = b[4];
    a[5] = b[5];
    a[6] = b[6];
    a[7] = b[7];
    a[8] = b[8];
    a[9] = b[9];
    a[10] = b[10];
    a[11] = b[11];
    a[12] = b[12];
    a[13] = b[13];
    a[14] = b[14];
    a[15] = b[15];
  }

  static Multiply(...mats: Float32Array[]): Float32Array {
    if (mats.length === 0) return Matrix4.Identity();
    if (mats.length === 1) return mats[0];

    let a = new Float32Array(16);
    Matrix4.Copy(a, mats[0]);
    for (let i = 1; i < mats.length; ++i) {
      a = Matrix4._multiply(a, mats[i]);
    }
    return a;
  }

  static MultiplyVec(mat: Float32Array, vec: Vector4): Vector4 {
    return [
      mat[0] * vec[0] + mat[4] * vec[1] + mat[8] * vec[2] + mat[12] * vec[3],
      mat[1] * vec[0] + mat[5] * vec[1] + mat[9] * vec[2] + mat[13] * vec[3],
      mat[2] * vec[0] + mat[6] * vec[1] + mat[10] * vec[2] + mat[14] * vec[3],
      mat[3] * vec[0] + mat[7] * vec[1] + mat[11] * vec[2] + mat[15] * vec[3],
    ];
  }

  static ToString(mat: Float32Array): string {
    return (
`${mat[0]},\t${mat[1]},\t${mat[2]},\t${mat[3]},
${mat[4]},\t${mat[5]},\t${mat[6]},\t${mat[7]},
${mat[8]},\t${mat[9]},\t${mat[10]},\t${mat[11]},
${mat[12]},\t${mat[13]},\t${mat[14]},\t${mat[15]},`
    );
  }

  private static _multiply(a: Float32Array, b: Float32Array) {
    const c = new Float32Array(16);

    for (let i = 0; i < 4; ++i) {
      for (let j = 0; j < 4; ++j) {
        c[(i << 2) + j] = 0;
        for (let k = 0; k < 4; ++k) {
          c[(i << 2) + j] += a[(i << 2) + k] * b[(k << 2) + j];
        }
      }
    }

    return c;
  }
}

function cos(theta: number) {
  const c = Math.cos(theta);
  return (-1e-10 < c && c < 1e-10) ? 0 : c;
}

function sin(theta: number) {
  const s = Math.sin(theta);
  return (-1e-10 < s && s < 1e-10) ? 0 : s;
}
