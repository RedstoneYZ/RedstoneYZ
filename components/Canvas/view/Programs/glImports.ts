export const glUnpacki = `
  int unpacki(int target, int from, int len) {
    return (target >> from) & (0x7fffffff >> (31 - len));
  }
`;

export const glUnpackif = `
  float unpackif(int target, int from, int len) {
    return float((target >> from) & (0x7fffffff >> (31 - len)));
  }
`;