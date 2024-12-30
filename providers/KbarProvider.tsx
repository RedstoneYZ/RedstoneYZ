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
        <KBarPositioner>
          <KBarAnimator>
            <KBarSearch />
            <RenderResults />
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
      onRender={({ item, active }) =>
        typeof item === "string" ? (
          <div>{item}</div>
        ) : (
          <div
            style={{
              background: active ? "red" : "green",
            }}
          >
            {item.name}
          </div>
        )
      }
    />
  );
}
