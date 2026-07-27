# CHANGELOG v2.2（branch_v2 / Fable 開發線）

## v2.2.0-F — 2026-06-30

### 新功能
1. **個別分頁存檔**
   - 工具列新增「⤓ 個別分頁」按鈕
   - 存檔前以 Modal 詢問檔名前綴，預填目前主 PDF 檔名（去除 `.pdf`）
   - 將左側所有頁面各自輸出為單頁 PDF
   - 自動依頁數補零編號：`01`、`02`、`03`；超過 99 頁時自動改為 `001`、`002`
   - 產出 ZIP 檔：`{檔名前綴}_pages.zip`

### 技術備註
1. **未新增第三方依賴**
   - 採用內建無壓縮 ZIP writer（store method）
   - PDF 本身已高度壓縮，再壓縮收益有限；此做法降低離線打包與授權維護成本
2. **共用 PDF 頁面輸出邏輯**
   - 新增 `appendPageToPdfDocument()`，供「另存新 PDF」與「個別分頁存檔」共用
   - 新增 `makeSinglePagePdf()`，負責單頁 PDF bytes 產生
3. **ZIP 相容性**
   - ZIP 檔名使用 UTF-8 filename flag
   - 內建 CRC32、Local File Header、Central Directory、End of Central Directory

### 測試重點
- T34：輸入中文檔名前綴後，ZIP 內 PDF 檔名能正確顯示
- T35：左側混合原 PDF 頁、右側插入頁、圖片頁、合併頁時，每頁輸出的 PDF 內容正確
