"use client";

import "@/styles/article.css";

import { usePathname } from "next/navigation";
import formatDate from "@/utils/formatDate";
import Link from "@/components/Link";
import getMetadata from "@/utils/getMetadata";

export default function Layout({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  // The layout does not apply to the root page.
  if (path === "/article") {
    return children;
  }

  const { title, author, created, categories } = getMetadata(path);
  return (
    <div>
      <div className="flex flex-col items-center justify-between border-b-2 border-solid border-slate-400 p-5">
        <div className="text-gray-400">
          {formatDate(created, "zh-tw")} - {author}
        </div>
        <div className="my-3 text-4xl font-bold md:text-5xl">{title}</div>
      </div>
      <div className="grid grid-flow-row grid-cols-4 gap-8 px-2">
        <div className="col-span-4 my-3 xl:col-span-3 xl:pb-0">{children}</div>
        <div className="col-span-4 flex flex-col xl:col-span-1 xl:pb-0">
          <div className="flex flex-col border-b border-solid border-slate-300 py-6 dark:border-slate-600">
            <div className="my-1 text-gray-400">標籤</div>
            <div className="my-1">
              {categories.map((v, i) => (
                <Link
                  className="mr-3 text-sm font-medium uppercase text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                  key={i}
                  href={`/category/${v}`}
                >
                  {v.toUpperCase()}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex flex-col border-b border-solid border-slate-300 py-6 dark:border-slate-600">
            <div className="my-1 text-gray-400">上一篇文</div>
          </div>
        </div>
      </div>
    </div>
  );
}
