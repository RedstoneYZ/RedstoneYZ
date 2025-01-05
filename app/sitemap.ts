import type { MetadataRoute } from "next";
import siteMetadata from "@/data/siteMetadata";
import getArticles from "@/utils/getArticles";

export default function sitemap(): MetadataRoute.Sitemap {
  const articleRoutes = getArticles().map((post) => ({
    url: `${siteMetadata.siteUrl}${post.link}`,
    lastModified: post.updated ?? post.created,
    changeFrequency: 'monthly' as const
  }));

  const routes = ["", "article", "category"].map((route) => ({
    url: `${siteMetadata.siteUrl}/${route}`,
    lastModified: new Date().toISOString().split("T")[0],
    changeFrequency: 'daily' as const
  }));

  return [...routes, ...articleRoutes];
}
