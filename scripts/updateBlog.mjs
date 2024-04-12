import fs from "fs";

fs.writeFileSync(
  "./data/blogHierarchy.json", 
  JSON.stringify(readData("./data/blog/", "blog"), null, 2)
);

/**
 * @param {string} path 
 */
function readData(fullPath, path) {
  if (path.endsWith(".mdx")) {
    const content = fs.readFileSync(fullPath).toString().split('\n');
    for (const line of content) {
      if (line.startsWith('title')) {
        const title = line.match(/title\: +(.+)/)[1];
        return title;
      }
    }
    throw new Error(`${fullPath} does not have a title`);
  }

  if (fs.statSync(fullPath).isDirectory()) {
    const children = fs.readdirSync(fullPath);
    const result = {};
    children.forEach(child => {
      result[child] = readData(fullPath + "/" + child, child);
    })
    return result;
  }

  throw new Error(`${fullPath} is not a mdx file nor a directory`);
}
