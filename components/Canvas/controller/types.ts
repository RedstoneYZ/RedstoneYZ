import { MapData } from "../model/types";

export interface ControllerOptions {
  canvas: HTMLCanvasElement;
  xLen: number;
  yLen: number;
  zLen: number;
  mapName: string;
  preLoadData?: MapData;
}

export interface PlayerXYZ {
  x: number;
  y: number;
  z: number;
}

export interface PlayerFacing {
  yaw: number;
  pitch: number;
}

export enum KeyBoard {
  W = "KeyW", 
  A = "KeyA", 
  S = "KeyS", 
  D = "KeyD", 
  R = "KeyR", 
  LeftShift = "ShiftLeft", 
  Space = "Space", 
  D1 = "Digit1", 
  D2 = "Digit2", 
  D3 = "Digit3", 
  D4 = "Digit4", 
  D5 = "Digit5", 
  D6 = "Digit6", 
  D7 = "Digit7", 
  D8 = "Digit8", 
  D9 = "Digit9", 
}

export type MovementKey = KeyBoard.W | KeyBoard.A | KeyBoard.S | KeyBoard.D | KeyBoard.LeftShift | KeyBoard.Space;
export type DigitKey = KeyBoard.D1 | KeyBoard.D2 | KeyBoard.D3 | KeyBoard.D4 | KeyBoard.D5 | KeyBoard.D6 | KeyBoard.D7 | KeyBoard.D8 | KeyBoard.D9;