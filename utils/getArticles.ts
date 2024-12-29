import articleMetadata from "@/data/articleMetadata.json";
import { Article, NestedArticle } from "@/types";

const articlesCache: Article[] = [];

export default function getArticles(): Article[] {
  if (!articlesCache.length) {
    articlesCache.push(..._recursive(articleMetadata));
  }

  return articlesCache;
}

function _recursive(data: NestedArticle): Article[] {
  const result: Article[] = [];

  for (const key in data) {
    const value = data[key as keyof typeof data];
    if (key === "page") {
      result.push(value as Article);
    } else {
      const subResult = _recursive(value as NestedArticle);
      result.push(...subResult);
    }
  }

  return result;
}