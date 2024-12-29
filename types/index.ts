type MDX = {
  /** Raw MDX source */
  raw: string
  /** Prebundled via mdx-bundler */
  code: string
}

type RawDocumentData = {
  /** Relative to `contentDirPath` */
  sourceFilePath: string
  sourceFileName: string
  /** Relative to `contentDirPath` */
  sourceFileDir: string
  contentType: 'markdown' | 'mdx' | 'data'
  /** A path e.g. useful as URL paths based on `sourceFilePath` with file extension removed and `/index` removed. */
  flattenedPath: string
}

/** Document types */
export type Article = {
  /** File path relative to `contentDirPath` */
  _id: string
  _raw: RawDocumentData
  type: string
  title: string
  created: string
  author: string
  categories: string[]
  lastmod?: string | undefined
  draft?: boolean | undefined
  summary?: string | undefined
  images?: any | undefined
  authors?: string[] | undefined
  layout?: string | undefined
  bibliography?: string | undefined
  canonicalUrl?: string | undefined
  /** MDX file body */
  body: MDX
  slug: string
  path: string
  filePath: string
  structuredData: Record<string, string>
}

export type Authors = {
  /** File path relative to `contentDirPath` */
  _id: string
  _raw: RawDocumentData
  type: string
  name: string
  avatar?: string | undefined
  occupation?: string | undefined
  company?: string | undefined
  email?: string | undefined
  twitter?: string | undefined
  linkedin?: string | undefined
  github?: string | undefined
  layout?: string | undefined
  /** MDX file body */
  body: MDX
  slug: string
  path: string
  filePath: string
}

export type CoreContent<T> = Omit<T, 'body' | '_raw' | '_id'>;
