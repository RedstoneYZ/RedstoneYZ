"use client";

import getArticles from "@/utils/getArticles";
import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider as Provider,
  KBarSearch,
  KBarResults,
  useMatches,
} from "kbar";
import { useRouter } from "next/navigation";

const articles = getArticles();

export default function KBarProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <Provider
      actions={articles.map((atc) => ({
        id: atc.title,
        name: atc.title,
        perform: () => router.push(atc.link),
      }))}
    >
      <KBarPortal>
        <KBarPositioner className="bg-gray-500/50 backdrop-blur dark:bg-slate-800/50">
          <KBarAnimator className="w-[70%] lg:w-[50%] lg:min-w-[700px]">
            <div className="overflow-hidden rounded-2xl bg-gray-100 pt-1 dark:bg-slate-800">
              <div className="border-b border-gray-200 bg-gray-100 dark:border-slate-700 dark:bg-slate-800">
                <KBarSearch
                  className="m-[2%] w-[96%] rounded-lg border-none bg-gray-100 focus:outline-none focus:ring focus:ring-transparent dark:bg-slate-800"
                  defaultPlaceholder="請輸入關鍵字……"
                />
              </div>
              <RenderResults />
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </Provider>
  );
}

function RenderResults() {
  const { results } = useMatches();

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) => {
        const content = typeof item === "string" ? item : item.name;
        const bg = active ? "bg-gray-200 dark:bg-slate-700" : "bg-gray-100 dark:bg-slate-800";
        return (
          <div
            className={`${bg} text-md flex h-16 flex-col justify-center border-b border-gray-200 px-8 text-gray-700 hover:cursor-pointer dark:border-slate-700 dark:text-gray-300 md:h-20 md:text-lg`}
          >
            {content}
          </div>
        );
      }}
    />
  );
}
