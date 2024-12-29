import Link from "@/components/Link";
import articleMetaData from "@/data/articleMetadata.json";
import formatDate from "@/utils/formatDate";

const articles = parseMetadata(articleMetaData);

export default function Article() {
  return (
    <div>
      <div className="itens-center flex flex-row justify-center border-b-2 border-solid border-slate-400">
        <div className="my-10 text-4xl font-bold md:text-5xl">所有文章</div>
      </div>
      <div className="px-2">
        {articles.map((atc, i) => (
          <div
            className="border-b border-slate-400 px-2 py-5 hover:bg-gray-100 dark:hover:bg-gray-900"
            key={i}
          >
            <div className="text-gray-400">{formatDate(atc.created, "zh-tw")}</div>
            <div className="my-3">
              <Link href={atc.link} className="text-2xl font-bold">
                {atc.title}
              </Link>
            </div>
            <div>
              {atc.categories.map((v, i) => (
                <Link
                  className="mr-3 text-sm font-medium uppercase text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                  key={i}
                  href={`/category/${v}`}
                >
                  {v.toUpperCase()}
                </Link>
              ))}
            </div>
            {/* TODO: <div>{atc.summary}</div> */}
          </div>
        ))}
      </div>
    </div>
  );
}

function parseMetadata(data: NestedArticle) {
  const result: Article[] = [];

  for (const key in data) {
    const value = data[key as keyof typeof data];
    if (key === "page") {
      result.push(value as Article);
    } else {
      const subResult = parseMetadata(value as NestedArticle);
      result.push(...subResult);
    }
  }

  return result;
}

type NestedArticle = { [k: string]: Article | NestedArticle };

interface Article {
  title: string;
  author: string;
  created: string;
  categories: string[];
  link: string;
}
