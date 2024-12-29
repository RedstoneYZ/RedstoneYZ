import articleMetadata from "@/data/articleMetadata.json";
import { Article } from "@/types";

export default function getMetadata(path: string): Article {
  const route = path.split("/");
  route.shift(); // "" (empty string)
  route.shift(); // "article"

  let map: Record<string, any> = articleMetadata;

  route.forEach((filename) => {
    if (!(filename in map)) {
      throw new Error(`[[Error]] Metadata not found for ${path}`);
    }
    map = map[filename as keyof typeof map];
  });

  if (!("page" in map)) {
    throw new Error(`[[Error]] Metadata not found for ${path}`);
  }

  const result = map.page;

  if (!result.title) {
    throw new Error(`[[Metadata Error]] Missing title for ${path}`);
  }
  if (!result.author) {
    throw new Error(`[[Metadata Error]] Missing author for ${path}`);
  }
  if (!result.created) {
    throw new Error(`[[Metadata Error]] Missing create time for ${path}`);
  }
  if (!result.categories) {
    throw new Error(`[[Metadata Error]] Missing categories for ${path}`);
  }

  return result;
}