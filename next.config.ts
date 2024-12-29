import rehypeKatex from 'rehype-katex';
import rehypePrismPlus from 'rehype-prism-plus';
 
/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
}
 
const withMDX = require('@next/mdx')({
  options: {
    rehypePlugins: [rehypeKatex, rehypePrismPlus]
  }
});

// Merge MDX config with Next.js config
export default withMDX(nextConfig);