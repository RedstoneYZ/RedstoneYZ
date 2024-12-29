export type NestedArticle = { [k: string]: Article | NestedArticle };

export interface Article {
  title: string;
  author: string;
  created: string;
  categories: string[];
  link: string;
}
