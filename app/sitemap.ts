import type { MetadataRoute } from "next";
import siteMetadata from "@/data/siteMetadata";
import getArticles from "@/utils/getArticles";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = siteMetadata.siteUrl;

  const articleRoutes = getArticles().map((post) => ({
    url: `${siteUrl}${post.link}`,
    lastModified: post.created,
  }));

  const routes = ["", "article", "categories"].map((route) => ({
    url: `${siteUrl}/${route}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  return [...routes, ...articleRoutes];
}
