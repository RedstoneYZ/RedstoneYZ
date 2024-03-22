import { FourFacings, SixSides } from "../../typings/types";

class Maps extends null {
  static ReverseDir = Object.freeze({
    west: 'east', 
    east: 'west', 
    down: 'up', 
    up: 'down', 
    north: 'south', 
    south: 'north'
  });

  static P6DArray: [SixSides, [number, number, number]][] = [
    ['west', [-1, 0, 0]], 
    ['east', [1, 0, 0]], 
    ['down', [0, -1, 0]], 
    ['up', [0, 1, 0]], 
    ['north', [0, 0, -1]], 
    ['south', [0, 0, 1]]
  ];

  static S6DArray: [SixSides, [number, number, number]][] = [
    ['down', [0, -1, 0]], 
    ['up', [0, 1, 0]], 
    ['north', [0, 0, -1]], 
    ['south', [0, 0, 1]], 
    ['west', [-1, 0, 0]], 
    ['east', [1, 0, 0]]
  ];

  static P4DArray: [FourFacings, [number, number, number]][] = [
    ['north', [0, 0, -1]], 
    ['east', [1, 0, 0]], 
    ['south', [0, 0, 1]], 
    ['west', [-1, 0, 0]]
  ];


  static P6DMap: Record<SixSides, [number, number, number]> = {
    west: [-1, 0, 0], 
    east: [1, 0, 0], 
    down: [0, -1, 0], 
    up: [0, 1, 0], 
    north: [0, 0, -1], 
    south: [0, 0, 1]
  };

  static S6DMap: Record<SixSides, [number, number, number]> = {
    down: [0, -1, 0], 
    up: [0, 1, 0], 
    north: [0, 0, -1], 
    south: [0, 0, 1], 
    west: [-1, 0, 0], 
    east: [1, 0, 0]
  };

  static P4DMap: Record<FourFacings, [number, number, number]> = {
    north: [0, 0, -1], 
    east: [1, 0, 0], 
    south: [0, 0, 1], 
    west: [-1, 0, 0]
  };
}

export default Maps;