# Change Log — 本地端 PDF 頁面編輯器

---

## v1.1 Internal Secure Review — 2026-06-08

### 修改目標
強化資安屬性與第三方授權說明，適合公司內網部署使用。功能不變。

### 修改項目

#### 資安補強
1. **加入 Content-Security-Policy meta tag**
   - `connect-src 'none'` — 禁止所有外部網路連線
   - `script-src 'unsafe-inline' 'unsafe-eval' blob:` — 支援內嵌函式庫、Web Worker
   - `worker-src blob:` — 允許 PDF.js Web Worker（Blob URL）
   - `object-src 'none'` — 禁止 plugin 物件
   - `form-action 'none'` — 禁止表單提交

2. **修正外部連結安全屬性**
   - `<a target="_blank">` 全部加入 `rel="noopener noreferrer"`
   - 防止新開頁面透過 `window.opener` 存取原頁面

3. **加入 fetch(data:image/...) 說明註解**
   - 明確說明此 fetch 對象為瀏覽器記憶體內的 Data URL，不發出外部請求

4. **修正錯誤訊息**
   - 移除「請確認網路後重新整理」字樣
   - 改為「請確認本 HTML 檔案是否完整，或重新取得完整離線版檔案」
   - 避免離線工具誤導用戶或 IT 以為需要網路連線

#### 授權說明補強
5. **更新 About 面板**
   - 修正函式庫清單：移除 `docx-preview 0.1.22`（已改用 Mammoth.js）
   - 加入各函式庫授權類型（Apache 2.0 / MIT / BSD 2-Clause）
   - 修改授權文字：「供個人使用」→「內部離線文件整理工具」
   - 加入內網使用備註（5 條）
   - 加入 v1.1 變更說明區塊

6. **加入 HTML 底部第三方授權聲明**
   - 完整列出 PDF.js / pdf-lib / Mammoth.js / html2canvas 的 Copyright、License、用途
   - 備注 Mammoth.js 內部依賴（JSZip 等）

#### 其他
7. **加入檔頭版本註解**
   - 檔案名稱、版本、修改日期、使用情境、維護備註
8. **加入 HTML 頂部 Change Log 註解**

---

## v1.0 Claude Cowork Draft — 2026-06-01

### 初版功能
- 左側載入主 PDF，右側載入來源 PDF / 圖片 / DOCX
- 頁面縮圖預覽（三段縮放：110px / 165px / 220px）
- 頁面插入（before / after / first / last）
- 頁面刪除（含確認）
- 頁面排序（按鈕 + 拖曳）
- Undo 復原（最多 30 步，Ctrl+Z）
- 另存新 PDF（pdf-lib 合成）
- DOCX 轉換（Mammoth.js → iframe 分頁 → html2canvas 截圖）
- 所有函式庫內嵌離線，無 CDN 依賴
- 深色主題 UI
