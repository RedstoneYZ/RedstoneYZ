# 介紹

一個中文導向的 Minecraft 紅石教學網站，目前仍位於開發階段。

使用模板：[tailwind-nextjs-starter-blog](https://github.com/timlrx/tailwind-nextjs-starter-blog/tree/main?fbclid=IwAR2gy9n9rYHckiw76XO48Oj4YCRz8oBhHe-aksCwUvMQfFnVrdb_T_hQdOM)

# 使用套件

- 必要套件
  - `@next/bundle-analyzer`：用於分析套件的大小與依賴關係，但因為 contentlayer 目前在 Windows 沒辦法執行 `npm build`，所以目前還沒用過。
  - `@next/mdx`：讓我們可以使用 MDX 來撰寫文章。
  - `@tailwindcss/forms`：讓輸入標籤的客製化變得比較容易。
  - `@tailwindcss/typography`：新增許多可以自動排版的 HTML 類別。
  - `autoprefixer`：根據 [Can I use](https://caniuse.com/) 調整 CSS 檔案以支援不同的瀏覽器。
  - `contentlayer`：目前使用的框架，但因為處在 Beta 版而且已經快一年沒更新了，可能在未來會考慮撤換到 `contentlayer2`。
  - `esbuild`。
  - `gray-matter`：輸入特定格式的字串（通常是一篇文章）後，可以得到一個容易處理的物件。
  - `image-size`：用來取得各種圖檔的長寬。
  - `next`。
  - `next-contentlayer`。
  - `next-themes`：支援深色模式。
  - `pliny`：似乎是 SEO 相關的套件。
  - `postcss`。
  - `react`。
  - `react-dom`。
  - `rehype-katex`：Latex 相關。
  - `rehype-prism-plus`：產生程式碼區塊的 HTML。
  - `remark`：處理 Markdown 檔的套件。
  - `remark-gfm`：支援 GFM 語法。
  - `remark-math`：Latex 相關。
  - `tailwindcss`。
  - `unist-util-visit`。

# 歷史

- 2024/3/18：建立專案
