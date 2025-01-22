import type { NextConfig } from 'next';
import rehypeKatex from 'rehype-katex';
import rehypePrismPlus from 'rehype-prism-plus';
import { watchArticle, watchAuthor } from "./utils/watcher";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      watchArticle();
      watchAuthor();
    }

    return config;
  },
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
}

const withMDX = require('@next/mdx')({
  options: {
    rehypePlugins: [rehypeKatex, rehypePrismPlus]
  }
});

export default withMDX(nextConfig);