import type { BlockState } from "../model/types";
import type { BlockModelRule } from "./types";

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
          if (Object.entries(r).every(([k, v]) => v.includes(`${states[k]}`))) {
            result.push(rule.apply);
            break;
          }
        }
      } else {
        if (Object.entries(rule.when).every(([k, v]) => v.includes(`${states[k]}`))) {
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
          const apply = this.makeRequired("length" in _value ? _value : [_value]);

          if (key === "") {
            return { when: {}, apply };
          }

          const when: Record<string, string[]> = {};
          key.split(',').forEach((rule) => {
            const [name, value] = rule.split("=");
            when[name] = [value];
          });
          return { when, apply };
        }),
      };

    return {
      singleMatch: false,
      rules: rawStates.multipart.map(({ when: _when, apply: _apply }) => {
        const apply = this.makeRequired("length" in _apply ? _apply : [_apply]);
        
        if ("AND" in _when) {
          if (typeof _when.AND === "string") {
            throw new Error("AND property should not have string value.");
          }

          const when: Record<string, string[]> = {};
          _when.AND.forEach(rules => {
            for (const key in rules) {
              when[key] = rules[key].split("|");
            }
          });
          return { when, apply };
        }

        if ("OR" in _when) {
          if (typeof _when.OR === "string") {
            throw new Error("OR property should not have string value.");
          }

          const OR: Record<string, string[]>[] = [];
          _when.OR.forEach(rules => {
            const rule: Record<string, string[]> = {};
            for (const key in rules) {
              rule[key] = rules[key].split("|");
            }
            OR.push(rule);
          });
          return { when: { OR }, apply };
        }

        const when: Record<string, string[]> = {};
        for (const key in _when) {
          when[key] = _when[key].split("|");
        }
        return { when, apply };
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
  when: { OR: Record<string, string[]>[] } | Record<string, string[]>;
  apply: BlockModelRule[];
}

type RawBlockStateModel = RawBlockStateModelVariants | RawBlockStateModelMultipart;

interface RawBlockStateModelVariants {
  variants: {
    [variant: string]: RawBlockStateModelRule | RawBlockStateModelRule[];
  };
}

interface RawBlockStateModelMultipart {
  multipart: RawBlockStateModelMultipartCase[];
}

interface RawBlockStateModelMultipartCase {
  when:
    | { OR: Record<string, string>[] }
    | { AND: Record<string, string>[] }
    | Record<string, string>;
  apply: RawBlockStateModelRule | RawBlockStateModelRule[];
}

interface RawBlockStateModelRule {
  model: string;
  x?: number;
  y?: number;
  uvlock?: boolean;
  weight?: number;
}
