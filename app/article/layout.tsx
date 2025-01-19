"use client";

import "@/styles/article.css";

import { usePathname } from "next/navigation";
import formatDate from "@/utils/formatDate";
import Link from "@/components/Link";
import getMetadata from "@/utils/getMetadata";
import ReferenceProvider from "@/providers/ReferenceProvider";
import { ReferenceList } from "@/components/article/Reference";
import GalleryProvider from "@/providers/GalleryProvider";
import { Gallery } from "@/components/article/Gallery";

export default function Layout({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  // The layout does not apply to the root page.
  if (path === "/article") {
    return children;
  }

  const { title, author, created, categories, updated, version } = getMetadata(path);
  return (
    <div>
      <div className="flex flex-col items-center justify-between border-b-2 border-solid border-slate-400 p-5">
        <div className="my-3 text-4xl font-bold md:text-5xl">{title}</div>
        <div className="text-gray-400">{version}</div>
      </div>
      <div className="grid grid-flow-row grid-cols-4 gap-8 px-2">
        <ReferenceProvider>
          <GalleryProvider>
            <div className="col-span-4 my-3 xl:col-span-3 xl:pb-0">
              {children}
              <ReferenceList />
              <Gallery />
            </div>
          </GalleryProvider>
        </ReferenceProvider>
        <div className="col-span-4 flex flex-col xl:col-span-1 xl:pb-0">
          <div className="flex flex-col border-b border-solid border-slate-300 py-6 dark:border-slate-600">
            <div className="my-1 text-gray-400">作者：{author}</div>
            <div className="my-1 text-gray-400">發布日期：{formatDate(created)}</div>
            {updated ? (
              <div className="my-1 text-gray-400">更新日期：{formatDate(updated)}</div>
            ) : (
              <></>
            )}
          </div>
          <div className="flex flex-col border-b border-solid border-slate-300 py-6 dark:border-slate-600">
            <div className="my-1 text-gray-400">標籤</div>
            <div className="my-1">
              {categories.map((v, i) => (
                <Link className="mr-3 text-sm uppercase" key={i} href={`/category/${v}`}>
                  {v.toUpperCase()}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
