# 離線單檔版

這個資料夾建置出 `standalone-dist/index.html`——一個包含全部程式碼與課程內容的
單一 HTML 檔案。不需要 Node.js、不需要伺服器、不需要部署，下載後用瀏覽器直接
開啟（雙擊或拖進瀏覽器分頁）就能使用，進度會存在瀏覽器的 localStorage 裡。

## 重新產生

```bash
npm install
npm run build:standalone
```

輸出在 `standalone-dist/index.html`。

## 跟正式的 Next.js App 有什麼不同

- 用 React Router 換成純前端的 hash 路由（網址列會出現 `#/book/...`），
  因為 `file://` 沒有伺服器可以處理一般路徑。
- 所有課程內容（`content/small-fry/lessons/` + `manifest.json`）在建置時
  被打包進 `standalone/content-data.ts`（自動產生，不進版控），直接內嵌在
  JS 裡，不需要在執行期讀檔案。
- 沒有「新增書籍」的內容處理流程（那需要 AI 逐字分級生成，只能在有完整開發
  環境時執行），單檔版只能瀏覽已經包好的內容。
- 字體改用系統內建的圓體字型，不依賴 next/font 抓 Google Fonts。

其餘功能（閱讀模式、字卡、三種練習題、生命值/XP/連續天數）跟正式版完全一樣。
