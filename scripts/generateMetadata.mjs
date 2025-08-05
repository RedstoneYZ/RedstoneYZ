import fs from "fs";
import { latestVersion } from "@/data/siteMetadata";

const PATH = "./app/article";

fs.writeFileSync("./data/articleMetadata.json", JSON.stringify(readData(PATH, ""), null, 2));

function readData(fullPath, path) {
  if (path.endsWith(".mdx")) {
    const content = fs.readFileSync(fullPath).toString();
    const metadata = parseMetadata(content);
    return format(metadata);
  }

  if (fs.statSync(fullPath).isDirectory()) {
    const children = fs.readdirSync(fullPath);
    const result = {};
    children.forEach((child) => {
      const content = readData(fullPath + "/" + child, child);
      if (!content) return;

      if (child.endsWith(".mdx")) {
        const relativePath = fullPath + "/" + child;
        content.link = relativePath.substring(
          "./app".length,
          relativePath.length - "/page.mdx".length,
        );
      }
      result[child === "page.mdx" ? "page" : child] = content;
    });
    return result;
  }
}

function parseMetadata(content) {
  const match = content.match(/^\{\/\*([\s\S]+?)\*\/\}/);
  if (!match || !match[1]) {
    return {};
  }

  return Object.fromEntries(
    match[1]
      .trim()
      .split("\n")
      .map((a) => {
        let [key, value] = a.split(/ *: */);
        const valueMatch = value.match(/\[(.+?)\]/);
        if (!valueMatch) return [key, value];

        return [key, valueMatch[1].split(/ *, */)];
      }),
  );
}

function format(metadata) {
  const { version } = metadata;
  if (version.endsWith("+")) {
    const ver = version.substring(0, version.length - 2);
    metadata.version = `Java ${ver} - ${latestVersion}`;
  }
  metadata.version = `Java ${version}`;
  return metadata;
}
