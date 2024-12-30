"use client";

import { ThemeProvider as Provider } from "next-themes";
import siteMetadata from "@/data/siteMetadata";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider attribute="class" defaultTheme={siteMetadata.theme} enableSystem>
      {children}
    </Provider>
  );
}
