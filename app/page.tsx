import { allArticles } from "@/data/Article";
import Main from "./Main";

export default async function Page() {
  return <Main posts={allArticles} />;
}
