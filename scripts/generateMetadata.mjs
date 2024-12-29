import fs from "fs";

const PATH = "./app/article";

fs.writeFileSync("./data/articleMetadata.json", JSON.stringify(readData(PATH, ""), null, 2));

function readData(fullPath, path) {
  if (path.endsWith(".mdx")) {
    const content = fs.readFileSync(fullPath).toString();
    return parseMetadata(content);
    throw new Error(`${fullPath} does not have a title`);
  }

  if (fs.statSync(fullPath).isDirectory()) {
    const children = fs.readdirSync(fullPath);
    const result = {};
    children.forEach((child) => {
      const content = readData(fullPath + "/" + child, child);
      if (!content) return;
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
        let [key, value] = a.split(/ *\: */);
        const valueMatch = value.match(/\[(.+?)\]/);
        if (!valueMatch) return [key, value];

        return [key, valueMatch[1].split(/ *, */)];
      }),
  );
}
