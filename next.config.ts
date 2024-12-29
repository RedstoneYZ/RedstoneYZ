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

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: 'true' === 'true',
});
 
// Merge MDX config with Next.js config
export default withBundleAnalyzer(withMDX(nextConfig))