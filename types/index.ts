export type NestedArticle = { [key: string]: Article | NestedArticle };

export interface Article {
  title: string;
  author: string;
  created: string;
  updated?: string;
  // TODO: Version should be a required field
  version?: string[];
  // TODO: Summary should be a required field
  summary?: string;
  categories: string[];
  link: string;
}
