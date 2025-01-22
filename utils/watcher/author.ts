import chokidar from "chokidar";
import fs from "fs";
import path from "path";
import { Author } from "@/types";
import strictEqual from "../strictEqual";
import parseMetadata from "./parseMetadata";

export default function watchAuthor() {
  chokidar.watch(`./app/author/**/*.mdx`).on('add', (filePath) => {
    const author = parseMetadata<Author>(filePath);
    if (!author) {
      console.warn(`[[Error]] No metadata is provided in ${filePath}`);
      return;
    }
    mutateEntry(author);
  }).on('change', (filePath) => {
    const author = parseMetadata<Author>(filePath);
    if (!author) {
      console.warn(`[[Error]] No metadata is provided in ${filePath}`);
      return;
    }
    mutateEntry(author);
  }).on("unlink", (filePath) => {
    deleteEntry(filePath);
  });
}

const authors: Author[] = [];

function mutateEntry(author: Author) {
  const index = authors.findIndex(a => a.link === author.link);

  if (index === -1) {
    authors.push(author);
  }
  else if (strictEqual(authors[index], author)) return;
  else {
    authors[index] = author;
  }

  fs.writeFileSync("./data/authorMetadata.json", JSON.stringify(authors, null, 2));
}

function deleteEntry(filePath: string) {
  const route = filePath.split(path.sep);
  const authorId = route[route.length - 2];
  const index = authors.findIndex(a => a.link === `/author/${authorId}`);

  if (index === -1) return;

  authors.splice(index, 1);
  fs.writeFileSync("./data/authorMetadata.json", JSON.stringify(authors, null, 2));
}
