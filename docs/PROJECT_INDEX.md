# PDF Manager — 專案索引（發布候選 / v2.2.0-F）

## 分枝說明
本發布候選由 **branch_v2 分枝**（Fable 開發線）v2.2.0-F 整理而成，自主線 v1.3.0 分出。
分枝版號帶 `-F` 後綴；原始開發檔仍保留於上層專案，本資料夾只作 GitHub 發布準備。
合併回主線時：人工審查 → 摘除 `-F` → 主線升 MINOR。

## 專案目標
提供 PDF 頁面級編輯功能：載入主 PDF、插入來源頁面、刪除頁面、調整順序、另存新檔。
全程瀏覽器本機執行，不上傳任何資料。

## 技術棧
- **前端**：純 HTML5 + CSS3 + Vanilla JavaScript（單一 `.html` 檔案，約 1500 行）
- **PDF 顯示**：PDF.js 3.11.174
- **PDF 操作**：pdf-lib 1.17.1
- **DOCX 轉換**：Mammoth.js 1.6.0 + html2canvas 1.4.1（.doc 舊格式不支援）
- **圖片支援**：JPG、PNG、GIF、BMP、WEBP（瀏覽器原生）

## 主要檔案
```
pdf_editor.html        — 主程式（開發版，CDN 載入函式庫）
build_offline.py       — 離線版打包腳本（讀 version.json，預設輸出至 release-assets/）
version.json           — 版號唯一真實來源
docs/                  — 歷史評估、開發日誌、測試與版號文件
release-assets/        — GitHub Release 附件；HTML 成品不納入 Git 歷史
```

## 啟動方式
直接用瀏覽器開啟 `pdf_editor.html`（Chrome / Edge 建議）。
離線版：`python build_offline.py` 產出 `release-assets/pdf_editor_offline_v{version}.html`。
若同名檔案已存在會停止；確認重建時使用 `python build_offline.py --force`。

## 功能現況（v2.2.0-F）
- 左側主 PDF：縮圖預覽（三段縮放）、刪除（含確認）、單頁拖曳重排、
  上移/下移/最前/最後、縮圖旋轉（↺↻）
- 右側來源：PDF / 圖片 / DOCX、多檔批次載入、多選（順序編號）、
  插入（before/after/first/last 或拖曳到左側）、複數頁合併為一頁（A4 垂直拼貼）
- 通用：Undo 30 步（Ctrl+Z）、另存新 PDF、拖曳開啟、深色主題

## 下一步（候選，見 BRANCH_EVALUATION.md 第四節）
- P8-A 多頁操作補完（多選拖曳、多頁上移/下移）
- P8-B 大檔效能（增量 DOM、懶渲染）
- P8-C 頁面預覽放大
- P8-D 批次選取工具
- P8-E Undo 記憶體優化

## 注意事項
- 原始 PDF 不會被覆蓋，輸出為新檔
- 加密 PDF 以 ignoreEncryption 嘗試載入，不保證成功
- 旋轉 PDF 頁會轉為點陣圖（文字不可再選取）
