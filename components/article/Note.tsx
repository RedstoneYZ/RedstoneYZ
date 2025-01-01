import { ReactNode } from "react";

export default function Note({ children }: { children: ReactNode }) {
  return (
    <div className="my-8 px-5 w-full border-8 rounded-lg border-lime-300 bg-lime-200 dark:border-lime-600 dark:bg-lime-700">
      <div className="my-3 text-xl font-bold">提示</div>
      {children}
    </div>
  );
}