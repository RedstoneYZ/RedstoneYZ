export type NestedArticle = { [key: string]: Article | NestedArticle };

export interface Article {
  title: string;
  author: string;
  created: string;
  updated?: string;
  version?: string;
  summary: string;
  categories: string[];
  link: string;
}

export interface Author {
  name: string;
  avatar: string;
  emain: string;
  github: string;
  link: string;
}