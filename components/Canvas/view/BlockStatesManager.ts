import { BlockStates } from "../model/types";
import { BlockModelRule } from "./types";

export default class BlockStatesManager {
  private blockStatesCache: { [key: string]: BlockStatesModel };

  constructor() {
    this.blockStatesCache = {};
  }

  async get(path: string, states: BlockStates): Promise<BlockModelRule[][]> {
    const blockStates = await this.getBlockStates(path);
    const result: BlockModelRule[][] = [];
    for (const rule of blockStates.rules) {
      if ("OR" in rule.when) {
        if (typeof rule.when.OR === "string") break; // never
        for (const r of rule.when.OR) {
          if (Object.entries(r).every(([k, v]) => `${states[k as keyof BlockStates]}` === v)) {
            result.push(rule.apply);
            break;
          }
        }
      }
      else {
        for (const state in rule.when) {
          if (`${states[state as keyof BlockStates]}` !== rule.when[state]) break;
        }
        if (blockStates.singleMatch) {
          return [rule.apply];
        }
        result.push(rule.apply);
      }
    }
    return result;
  }

  private async getBlockStates(path: string): Promise<BlockStatesModel> {
    if (path in this.blockStatesCache) {
      return this.blockStatesCache[path]!;
    }

    const raw_block_states = await this.loadRawBlockStates(path);
    return this.blockStatesCache[path] = this.parseStates(raw_block_states);
  }

  private async loadRawBlockStates(path: string): Promise<RawBlockStatesModel> {
    return require(`../../../public/json/states/${path}.json`) as RawBlockStatesModel;
  }

  private parseStates(rawStates: RawBlockStatesModel): BlockStatesModel {
    if ('variants' in rawStates) return {
      singleMatch: true, 
      rules: Object.entries(rawStates.variants).map(([key, _value]) => {
        const value = 'length' in _value ? _value : [_value];
        return {
          when: Object.fromEntries(key.split(',').map(a => a.split('='))),
          apply: this.makeRequired(value)
        };
      })
    }

    return {
      singleMatch: false, 
      rules: rawStates.muitipart.map(({ when: _when, apply: _apply }) => {
        const apply = 'length' in _apply ? _apply : [_apply];
        return {
          when: !('AND' in _when) ? _when : (
            typeof _when.AND !== "string" ? 
              _when.AND.reduce((a, c) => ({ ...a, ...c }), {}) : {}
          ),
          apply: this.makeRequired(apply)
        };
      })
    };
  }

  private parsePath(path: string): string {
    if (path.startsWith("minecraft:")) {
      path = path.substring(10);
    }
    if (path.startsWith("block/")) {
      path = path.substring(6);
    }
    return path;
  }

  private makeRequired(data: RawBlockStatesModelRule[]): BlockModelRule[] {
    return data.map(({ model, x, y, uvlock, weight }) => ({
      model: this.parsePath(model), 
      x: x ?? 0, 
      y: y ?? 0, 
      uvlock: uvlock ?? false, 
      weight: weight ?? 1
    }))
  }
}

interface BlockStatesModel {
  singleMatch: boolean;
  rules: BlockStatesModelRule[];
}

interface BlockStatesModelRule {
  when: 
    | { OR: { [state: string]: string }[] }
    | { [state: string]: string };
  apply: Required<RawBlockStatesModelRule>[];
}

type RawBlockStatesModel = RawBlockStatesModelVariants | RawBlockStatesModelMuitipart;

interface RawBlockStatesModelVariants {
  variants: {
    [variant: string]: RawBlockStatesModelRule | RawBlockStatesModelRule[]
  };
}

interface RawBlockStatesModelMuitipart {
  muitipart: RawBlockStatesModelMuitipartCase[];
}

interface RawBlockStatesModelMuitipartCase {
  when: 
    | { OR: { [state: string]: string }[] }
    | { AND: { [state: string]: string }[] }
    | { [state: string]: string };
  apply: RawBlockStatesModelRule | RawBlockStatesModelRule[];
}

interface RawBlockStatesModelRule {
  model: string;
  x?: number;
  y?: number;
  uvlock?: boolean;
  weight?: number;
}
