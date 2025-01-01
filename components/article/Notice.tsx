import { ReactNode } from "react";

export default function Note({ children }: { children: ReactNode }) {
  return (
    <div className="my-8 px-5 w-full border-8 rounded-lg border-primary-300 bg-primary-200 dark:border-primary-600 dark:bg-primary-700">
      <div className="my-3 text-xl font-bold">注意</div>
      {children}
    </div>
  );
}