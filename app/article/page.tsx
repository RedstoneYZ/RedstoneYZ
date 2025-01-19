import Link from "@/components/Link";
import formatDate from "@/utils/formatDate";
import getArticles from "@/utils/getArticles";

const articles = getArticles();

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
            <div className="text-gray-400">{formatDate(atc.created)}</div>
            <div className="my-3">
              <Link plain href={atc.link} className="text-2xl font-bold">
                {atc.title}
              </Link>
            </div>
            <div>
              {atc.categories.map((v, i) => (
                <Link
                  className="mr-3 text-sm font-medium uppercase"
                  key={i}
                  href={`/category/${v}`}
                >
                  {v.toUpperCase()}
                </Link>
              ))}
            </div>
            <div>{atc.summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
