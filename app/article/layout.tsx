"use client";

import "@/styles/article.css";

import { usePathname } from "next/navigation";
import articleMetadata from "@/data/articleMetadata.json";
import formatDate from "@/utils/formatDate";
import { Article } from "@/types";
import Link from "@/components/Link";

export default function Layout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { title, author, created, categories } = getMetadata(path);

  return (
    <div>
      <div className="p-5 flex flex-col justify-between items-center border-b-2 border-solid border-slate-400">
        <div className="text-gray-400">{formatDate(created, "zh-tw")} - {author}</div>
        <div className="my-3 text-4xl md:text-5xl font-bold">{title}</div>
      </div>
      <div className="grid grid-cols-4 grid-flow-row gap-8 px-2">
        <div className="col-span-4 xl:col-span-3 xl:pb-0 my-3">{children}</div>
        <div className="col-span-4 xl:col-span-1 xl:pb-0 flex flex-col">
          <div className="py-6 border-b border-solid border-slate-300 dark:border-slate-600 flex flex-col">
            <div className="text-gray-400 my-1">標籤</div>
            <div className="my-1">{categories.map((v, i) =>
              <Link className="mr-3 text-sm font-medium uppercase text-primary-500 hover:text-primary-600 dark:hover:text-primary-400" key={i} href={`/category/${v}`}>{v.toUpperCase()}</Link>
            )}</div>
          </div>
          <div className="py-6 border-b border-solid border-slate-300 dark:border-slate-600 flex flex-col">
            <div className="text-gray-400 my-1">上一篇文</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getMetadata(path: string): Article {
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
