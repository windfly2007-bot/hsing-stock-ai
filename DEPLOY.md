# Hsing Stock AI PWA 部署說明

這是一個靜態 PWA，可以部署到 Netlify、Vercel、Firebase Hosting、Cloudflare Pages。

## GitHub Pages

1. 到 https://github.com/new 建立新 repository，例如 `hsing-stock-ai`
2. 將本資料夾內所有檔案上傳到 repository 根目錄
3. 到 repository 的 `Settings` -> `Pages`
4. `Build and deployment` 選 `GitHub Actions`
5. 回到 `Actions` 等待 `Deploy Hsing Stock AI` 完成
6. 完成後網址會類似：

   `https://你的帳號.github.io/hsing-stock-ai/`

## 最簡單：Netlify Drop

1. 打開 https://app.netlify.com/drop
2. 將整個 `hsing-stock-ai` 資料夾拖進頁面
3. Netlify 會產生一個公開 HTTPS 網址
4. 手機 4G 打開該網址
5. iPhone 用 Safari 分享選單「加入主畫面」；Android Chrome 可選「安裝應用程式」

## Vercel

1. 建立 GitHub repo 或使用 Vercel CLI
2. 將本資料夾作為專案根目錄
3. Framework 選 `Other`
4. Build command 留空
5. Output directory 設為 `.`

## 重要安全提醒

目前密碼鎖是前端原型保護，密碼會存在 JavaScript 裡。部署到公開網址後，適合個人測試與展示，不適合當正式資安。

如果要長期使用並放真實持股資料，建議下一版加入：

- 後端登入驗證
- 資料庫
- LINE Notify / App Push
- 排程抓價與策略更新
- Cloudflare Access 或正式帳號系統

## 更新後手機還看到舊版

請使用新網址加版本參數，例如：

`https://你的網址/index.html?v=latest`

或清除瀏覽器網站資料後重新開啟。
