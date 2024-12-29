import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import siteMetadata from "../data/siteMetadata.js";

const generateRssItem = (config, post) => `
  <item>
    <guid>${config.siteUrl}/article/${post.slug}</guid>
    <title>${escape(post.title)}</title>
    <link>${config.siteUrl}/article/${post.slug}</link>
    ${post.summary && `<description>${escape(post.summary)}</description>`}
    <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    <author>${config.email} (${config.author})</author>
    ${post.tags && post.tags.map((t) => `<category>${t}</category>`).join("")}
  </item>
`;

const generateRss = (config, posts, page = "feed.xml") => {
  return `
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>${escape(config.title)}</title>
      <link>${config.siteUrl}/article</link>
      <description>${escape(config.description)}</description>
      <language>${config.language}</language>
      <managingEditor>${config.email} (${config.author})</managingEditor>
      <webMaster>${config.email} (${config.author})</webMaster>
      <lastBuildDate>${new Date(posts[0].date).toUTCString()}</lastBuildDate>
      <atom:link href="${config.siteUrl}/${page}" rel="self" type="application/rss+xml"/>
      ${posts.map((post) => generateRssItem(config, post)).join("")}
    </channel>
  </rss>
`;
};

async function generateRSS(config, allArticles, page = "feed.xml") {
  // TODO: articles
  // const publishPosts = allArticles.filter((post) => post.draft !== true);
  // // RSS for article
  // if (publishPosts.length > 0) {
  //   const rss = generateRss(config, publishPosts);
  //   writeFileSync(`./public/${page}`, rss);
  // }

  // TODO: categories
  // if (publishPosts.length > 0) {
  //   for (const tag of Object.keys(tagData)) {
  //     const filteredPosts = allArticles.filter((post) => post.tags.includes(tag));
  //     if (filteredPosts.length > 0) {
  //       const rss = generateRss(config, filteredPosts, `tags/${tag}/${page}`);
  //       const rssPath = path.join("public", "tags", tag);
  //       mkdirSync(rssPath, { recursive: true });
  //       writeFileSync(path.join(rssPath, page), rss);
  //     }
  //   }
  // }
}

const rss = () => {
  // generateRSS(siteMetadata, allArticles);
  console.log("RSS feed generated...");
};
export default rss;

const escapeMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

function escape(string) {
  return string.replace(/[&<>'"]/g, (m) => escapeMap[m]);
}
