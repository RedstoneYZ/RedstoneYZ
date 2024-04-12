/* eslint-disable jsx-a11y/anchor-is-valid */
'use client'

import { usePathname } from 'next/navigation'
import { slug } from 'github-slugger'
import { formatDate } from 'pliny/utils/formatDate'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Article } from 'contentlayer/generated'
import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import tagData from 'app/tag-data.json'
import articleHierarchy from '@/app/articleHierarchy.json'

interface PaginationProps {
  totalPages: number
  currentPage: number
}
interface ListLayoutProps {
  posts: CoreContent<Article>[]
  title: string
  initialDisplayPosts?: CoreContent<Article>[]
  pagination?: PaginationProps
}

function Pagination({ totalPages, currentPage }: PaginationProps) {
  const pathname = usePathname()
  const basePath = pathname.split('/')[1]
  const prevPage = currentPage - 1 > 0
  const nextPage = currentPage + 1 <= totalPages

  return (
    <div className="space-y-2 pb-8 pt-6 md:space-y-5">
      <nav className="flex justify-between">
        {!prevPage && (
          <button className="cursor-auto disabled:opacity-50" disabled={!prevPage}>
            Previous
          </button>
        )}
        {prevPage && (
          <Link
            href={currentPage - 1 === 1 ? `/${basePath}/` : `/${basePath}/page/${currentPage - 1}`}
            rel="prev"
          >
            Previous
          </Link>
        )}
        <span>
          {currentPage} of {totalPages}
        </span>
        {!nextPage && (
          <button className="cursor-auto disabled:opacity-50" disabled={!nextPage}>
            Next
          </button>
        )}
        {nextPage && (
          <Link href={`/${basePath}/page/${currentPage + 1}`} rel="next">
            Next
          </Link>
        )}
      </nav>
    </div>
  )
}

export default function ListLayoutWithTags({
  posts,
  title,
  initialDisplayPosts = [],
  pagination,
}: ListLayoutProps) {
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  const sortedTags = tagKeys.sort((a, b) => tagCounts[b] - tagCounts[a])

  const displayPosts = initialDisplayPosts.length > 0 ? initialDisplayPosts : posts

  return (
    <div>
      <div className="pb-6 pt-6">
        <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:hidden sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
          {title}
        </h1>
      </div>
      <div className="flex sm:space-x-24">
        <div className="px-6 py-4 hidden h-full max-h-screen min-w-[310px] max-w-[310px] flex-wrap overflow-auto rounded bg-gray-50 pt-5 shadow-md dark:bg-gray-900/70 dark:shadow-gray-800/40 sm:flex">
          <ArticleTable data={articleHierarchy} parent='/article/' title={title}></ArticleTable>
        </div>
        <RightPanel displayPosts={displayPosts} pagination={pagination}></RightPanel>
      </div>
    </div>
  )
}

type ArticleData = { [key: string]: ArticleData | string };

function ArticleTable({
  data, parent, title
}: {
  data: ArticleData, 
  parent: string, 
  title: string
}) {
  const pathname = usePathname();

  return (
    <ul>
      {
        'index.mdx' in data && typeof data["index.mdx"] === "string" ? 
          <Link
            href={parent}
            className="py-2 text-sm font-medium uppercase text-gray-500 hover:text-primary-500 dark:text-gray-300 dark:hover:text-primary-500"
          >
            {data["index.mdx"]}
          </Link> : 
        parent === "/article/" ? 
          pathname.startsWith('/article') ? (
            <h3 className="font-bold text-primary-500">{title}</h3>
          ) : (
            <Link
              href={`/article`}
              className="font-bold text-gray-700 hover:text-primary-500 dark:text-gray-300 dark:hover:text-primary-500"
            >
              {title}
            </Link>
          ) :
          parent
      }
      {Object.entries(data).filter(([key]) => key !== "index.mdx").map(([key, value]) => {
        return (
          <li key={key} className="mx-5 my-3">
            {typeof value === "string" ? 
              <Link
                href={parent + key.substring(0, key.length - 4)}
                className="py-2 text-sm font-medium uppercase text-gray-500 hover:text-primary-500 dark:text-gray-300 dark:hover:text-primary-500"
              >
                {value}
              </Link> : 
              <ArticleTable data={value} parent={parent + key + "/"} title={title}></ArticleTable>}
          </li>
        )
      })}
    </ul>
  );
}

function RightPanel({
  displayPosts, pagination
}: {
  displayPosts: CoreContent<Article>[],
  pagination?: PaginationProps
}) {
  return (
    <div>
      <ul>
        {displayPosts.map((post) => {
          const { path, date, title, summary, tags } = post
          return (
            <li key={path} className="py-5">
              <article className="flex flex-col space-y-2 xl:space-y-0">
                <dl>
                  <dt className="sr-only">Published on</dt>
                  <dd className="text-base font-medium leading-6 text-gray-500 dark:text-gray-400">
                    <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                  </dd>
                </dl>
                <div className="space-y-3">
                  <div>
                    <h2 className="text-2xl font-bold leading-8 tracking-tight">
                      <Link href={`/${path}`} className="text-gray-900 dark:text-gray-100">
                        {title}
                      </Link>
                    </h2>
                    <div className="flex flex-wrap">
                      {tags?.map((tag) => <Tag key={tag} text={tag} />)}
                    </div>
                  </div>
                  <div className="prose max-w-none text-gray-500 dark:text-gray-400">
                    {summary}
                  </div>
                </div>
              </article>
            </li>
          )
        })}
      </ul>
      {pagination && pagination.totalPages > 1 && (
        <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
      )}
    </div>
  );
}