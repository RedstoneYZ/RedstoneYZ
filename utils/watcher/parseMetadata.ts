import fs from "fs";
import { latestVersion } from "../../data/siteMetadata";

export default function <T>(path: string): T | void {
  const content = fs.readFileSync(path).toString();
  const match = content.match(/^\{\/\*([\s\S]+?)\*\/\}/);
  if (!match || !match[1]) return;

  const result = Object.fromEntries(
    match[1]
      .trim()
      .split("\n")
      .map((a) => {
        const entryMatch = a.match(/^(.+?) *?: *(.+?)$/);
        if (!entryMatch) {
          throw new Error(`[[Error]] \`${a}\` does not match the required format.`);
        }

        let [, key, value] = entryMatch;
        const valueMatch = value.match(/\[(.+?)\]/);
        if (!valueMatch) return [key, value];

        return [key, valueMatch[1].split(/ *, */)];
      }),
  );

  result.link = path.replaceAll("\\", "/").substring(
    "app".length,
    path.length - "/page.mdx".length,
  );

  if (result.version) {
    if (result.version.endsWith("+")) {
      const ver = result.version.substring(0, result.version.length - 1);
      result.version = `Java ${ver} - ${latestVersion}`;
    }
    else {
      result.version = `Java ${result.version}`;
    }
  }

  return result as T;
}