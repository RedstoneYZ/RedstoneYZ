import chokidar from "chokidar";
import fs from "fs";
import { Article, NestedArticle } from "@/types";
import strictEqual from "../strictEqual";
import parseMetadata from "./parseMetadata";

/**
 * 檢查文章頁面變動並更新詮釋資料
 */
export default function watchArticle() {

  // 偵測新檔案
  chokidar.watch(`./app/article/**/*.mdx`).on('add', (filePath) => {
    const article = parseMetadata<Article>(filePath);

    // 沒有詮釋資料時產生警告
    if (!article) {
      console.warn(`[[Error]] No metadata is provided in ${filePath}`);
      return;
    }

    mutateEntry(article);
  })
  
  // 偵測檔案內容變動
  .on('change', (filePath) => {
    const article = parseMetadata<Article>(filePath);

    // 沒有詮釋資料時產生警告
    if (!article) {
      console.warn(`[[Error]] No metadata is provided in ${filePath}`);
      return;
    }

    mutateEntry(article);
  })
  
  // 偵測檔案刪除
  .on("unlink", (filePath) => {
    deleteEntry(filePath);
  });
}

const articles: NestedArticle = {};

/**
 * 新增或更新文章的詮釋資料
 * @param article 詮釋資料
 * @returns 
 */
function mutateEntry(article: Article) {
  // 只取 "/article/" 之後的路徑
  const route = article.link.substring("/article/".length).split(/[\\\/]/);

  // 沿著巢狀結構尋找詮釋資料
  let target: NestedArticle = articles;
  while (route.length) {
    const key = route.shift()!;

    // 因為有可能是正在新增資料，所以 target[key] 可能是 undefined
    const next = target[key];

    // 在迴圈內必定還沒走到底，如果遇到走到底的就需要報錯
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
  const route = filePath.split(/[\\\/]/);

  route.shift(); // ""
  route.shift(); // "article"
  route.pop();   // "page.mdx"

  // 儲存路徑上所有節點的鍵與參考
  const chain: [string, NestedArticle][] = [["", articles]];
  let target: NestedArticle = articles;

  while (route.length) {
    const key = route.shift()!;

    // 因為有可能是正在新增資料，所以 target[key] 可能是 undefined
    const next = target[key];

    // 在迴圈內必定還沒走到底，如果遇到走到底的就需要報錯
    if (next && isArticle(next)) {
      console.warn(`[[Error]] Error when traversing ${filePath}`);
      return;
    }

    target = target[key] = next ?? {};
    chain.unshift([key, target]);
  }

  // 不確定需不需要這句，如果之後出問題就把它加回來
  // if (!('page' in target)) return;

  delete target.page;

  // 沿著路徑一路把已經沒有小孩的節點刪除
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
