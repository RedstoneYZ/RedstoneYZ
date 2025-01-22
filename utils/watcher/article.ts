import chokidar from "chokidar";
import fs from "fs";
import path from "path";
import { Article, NestedArticle } from "@/types";
import strictEqual from "../strictEqual";
import parseMetadata from "./parseMetadata";

export default function watchArticle() {
  chokidar.watch(`./app/article/**/*.mdx`).on('add', (filePath) => {
    const article = parseMetadata<Article>(filePath);
    if (!article) {
      console.warn(`[[Error]] No metadata is provided in ${filePath}`);
      return;
    }
    mutateEntry(article);
  }).on('change', (filePath) => {
    const article = parseMetadata<Article>(filePath);
    if (!article) {
      console.warn(`[[Error]] No metadata is provided in ${filePath}`);
      return;
    }
    mutateEntry(article);
  }).on("unlink", (filePath) => {
    deleteEntry(filePath);
  });
}

const articles: NestedArticle = {};

function mutateEntry(article: Article) {
  const route = article.link.substring("/article/".length).split("/");

  let target: NestedArticle = articles;
  while (route.length) {
    const key = route.shift()!;
    const next = target[key];
    if (next && isArticle(next)) {
      console.warn(`[[Error]] Error when traversing ${article.link}`);
      return;
    }

    target = target[key] = next ?? {};
  }

  if (strictEqual(target.page as Article, article)) return;

  target.page = article;
  fs.writeFileSync("./data/articleMetadata.json", JSON.stringify(articles, null, 2));
}

function deleteEntry(filePath: string) {
  const route = filePath.split(path.sep);
  route.shift(), route.shift(), route.pop();

  const chain: [string, NestedArticle][] = [["", articles]];
  let target: NestedArticle = articles;
  while (route.length) {
    const key = route.shift()!;
    const next = target[key];
    if (next && isArticle(next)) {
      console.warn(`[[Error]] Error when traversing ${filePath}`);
      return;
    }

    target = target[key] = next ?? {};
    chain.unshift([key, target]);
  }

  if (!('page' in target)) return;
  delete target.page;

  while (chain.length) {
    const [key, article] = chain.shift()!;
    if (Object.keys(article).length) break;
    delete chain[0][1][key];
  }
  fs.writeFileSync("./data/articleMetadata.json", JSON.stringify(articles, null, 2));
}

function isArticle(value: Article | NestedArticle): value is Article {
  return typeof value.author === "string";
}
