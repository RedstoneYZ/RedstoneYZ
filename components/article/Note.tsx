import type { ReactNode } from "react";

export default function Note({ children }: { children: ReactNode }) {
  return (
    <div className="my-8 w-full rounded-lg border-8 border-lime-300 bg-lime-200 px-5 dark:border-lime-600 dark:bg-lime-700">
      <div className="my-3 text-xl font-bold">提示</div>
      {children}
    </div>
  );
}
