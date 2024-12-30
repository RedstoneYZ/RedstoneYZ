# 介紹

一個中文導向的 Minecraft 紅石教學網站，目前仍位於開發階段。

## 協作

1. 複製此專案。
```
git clone https://github.com/RedstoneYZ/RedstoneYZ
```

2. 下載所需套件。
```
npm ci
```

3. 常用的 npm 指令：
```
npm run dev         # 開發者模式
npm run lint        # 檢查語法
npm run build       # 編譯專案
```

4. 如果要提交 PR，請提交至 dev 分支上，並且先在本地 lint 並 build 一次，確定沒有錯誤再提交。

# 使用套件
- `@next/mdx`：讓我們可以使用 MDX 來撰寫文章。
- `@tailwindcss/forms`：讓輸入標籤的客製化變得比較容易。
- `@tailwindcss/typography`：新增許多可以自動排版的 HTML 類別。
- `autoprefixer`：根據 [Can I use](https://caniuse.com/) 調整 CSS 檔案以支援不同的瀏覽器。
- `esbuild`。
- `gray-matter`：輸入特定格式的字串（通常是一篇文章）後，可以得到一個容易處理的物件。
- `image-size`：用來取得各種圖檔的長寬。
- `next`。
- `next-themes`：支援深色模式。
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

# 開發日誌
- 處理所有 `TODO`
- 移除舊有套件與檔案
  - [ ] `/app/articleHierarchy.json`
  - [ ] `/data/Article`
  - [ ] `/data/headerNavLinks.ts`
  - [ ] `/data/siteMetadata.js`
- 修復 SEO 相關檔案
  - [ ] `/app/robots.tsx`
  - [ ] `/scripts/rss.tsx`
  - [ ] `/app/seo.tsx`
  - [ ] `/app/sitemap.tsx`
- 修復套件相依問題
  - [ ] 更新所有套件
  - [ ] `npm audit fix`
- 動態更新文章的 metadata
  - [ ] nodemon
- 文章需求
  - [ ] 更新 author 頁面
  - [ ] 新增 category 頁面
- 美術風格
  - [ ] kbar 搜尋欄
  - [ ] Logo
  - [ ] 客製化或季節性網站配色
  - [ ] 所有文章頁面設計
  - [ ] 首頁設計（等文章充足）
- 網站元素
  - [ ] 可放大的 Image
  - [ ] 引用系統
- Canvas 
  - [ ] 方塊不可破壞
  - [ ] 移除光影（簡單）
  - [ ] 新增光影選項（困難）
- 維基化
  - [ ] 帳號系統
  - [ ] 文章上傳、編輯與審核機制

# 歷史
- 2024/12/28：重啟專案
- 2024/03/18：建立專案
