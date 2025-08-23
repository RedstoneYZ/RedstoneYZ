import type { MDXComponents } from 'mdx/types'

import { Image } from "@/components/article/Gallery";
import Inventory from "@/components/article/Inventory";
import Link from "@/components/Link";
import Note from "@/components/article/Note";
import Notice from "@/components/article/Notice";
import Table from "@/components/article/Table";

const components = {
  h1: ({ children }) => (
    <h1 style={{ margin: "30px 0", fontSize: "2em", fontWeight: "bold" }}>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 style={{ margin: "20px 0", fontSize: "1.6em", fontWeight: "bold" }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ margin: "10px 0", fontSize: "1.3em", fontWeight: "bold" }}>{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 style={{ margin: "5px 0", fontSize: "1.1em", fontWeight: "bold" }}>{children}</h4>
  ),
  Image,
  Inventory,
  Link,
  Note,
  Notice,
  Table
} satisfies MDXComponents;

export function useMDXComponents(): MDXComponents {
  return components;
}