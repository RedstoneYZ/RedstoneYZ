export interface PlayerXYZ {
  x: number;
  y: number;
  z: number;
};

export interface PlayerFacing {
  direction: 'north' | 'east' | 'south' | 'west';
  yaw: number;
  pitch: number;
};