import { BlockState } from "../model/types";
import { BlockModelRule } from "./types";

export default class BlockStateManager {
  private blockStatesCache: { [key: string]: BlockStateModel };

  constructor() {
    this.blockStatesCache = {};
  }

  get(path: string, states: BlockState): BlockModelRule[][] {
    const blockStates = this.getBlockState(path);
    const result: BlockModelRule[][] = [];
    for (const rule of blockStates.rules) {
      if ("OR" in rule.when) {
        if (typeof rule.when.OR === "string") break; // never
        for (const r of rule.when.OR) {
          if (Object.entries(r).every(([k, v]) => `${states[k as keyof BlockState]}` === v)) {
            result.push(rule.apply);
            break;
          }
        }
      } else {
        if (Object.entries(rule.when).every(([k, v]) => `${states[k as keyof BlockState]}` === v)) {
          if (blockStates.singleMatch) {
            return [rule.apply];
          }
          result.push(rule.apply);
        }
      }
    }
    return result;
  }

  private getBlockState(path: string): BlockStateModel {
    if (path in this.blockStatesCache) {
      return this.blockStatesCache[path]!;
    }

    const raw_block_states = this.loadRawBlockState(path);
    return (this.blockStatesCache[path] = this.parseStates(raw_block_states));
  }

  private loadRawBlockState(path: string): RawBlockStateModel {
    return require(`../../../public/json/states/${path}.json`) as RawBlockStateModel;
  }

  private parseStates(rawStates: RawBlockStateModel): BlockStateModel {
    if ("variants" in rawStates)
      return {
        singleMatch: true,
        rules: Object.entries(rawStates.variants).map(([key, _value]) => {
          const value = "length" in _value ? _value : [_value];
          return {
            when: key.length ? Object.fromEntries(key.split(",").map((a) => a.split("="))) : {},
            apply: this.makeRequired(value),
          };
        }),
      };

    return {
      singleMatch: false,
      rules: rawStates.muitipart.map(({ when: _when, apply: _apply }) => {
        const apply = "length" in _apply ? _apply : [_apply];
        return {
          when: !("AND" in _when)
            ? _when
            : typeof _when.AND !== "string"
              ? _when.AND.reduce((a, c) => ({ ...a, ...c }), {})
              : {},
          apply: this.makeRequired(apply),
        };
      }),
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

  private makeRequired(data: RawBlockStateModelRule[]): BlockModelRule[] {
    return data.map(({ model, x, y, uvlock, weight }) => ({
      model: this.parsePath(model),
      x: x ?? 0,
      y: y ?? 0,
      uvlock: uvlock ?? false,
      weight: weight ?? 1,
    }));
  }
}

interface BlockStateModel {
  singleMatch: boolean;
  rules: BlockStateModelRule[];
}

interface BlockStateModelRule {
  when: { OR: { [state: string]: string }[] } | { [state: string]: string };
  apply: Required<RawBlockStateModelRule>[];
}

type RawBlockStateModel = RawBlockStateModelVariants | RawBlockStateModelMuitipart;

interface RawBlockStateModelVariants {
  variants: {
    [variant: string]: RawBlockStateModelRule | RawBlockStateModelRule[];
  };
}

interface RawBlockStateModelMuitipart {
  muitipart: RawBlockStateModelMuitipartCase[];
}

interface RawBlockStateModelMuitipartCase {
  when:
    | { OR: { [state: string]: string }[] }
    | { AND: { [state: string]: string }[] }
    | { [state: string]: string };
  apply: RawBlockStateModelRule | RawBlockStateModelRule[];
}

interface RawBlockStateModelRule {
  model: string;
  x?: number;
  y?: number;
  uvlock?: boolean;
  weight?: number;
}
