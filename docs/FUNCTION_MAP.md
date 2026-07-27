# FUNCTION_MAP — pdf_editor.html 函式索引

> 目的：降低開發時的 token 消耗。先查此表，再用 grep 函式名定位、只讀相關段落，
> 避免全檔讀取。**每次新增/刪除函式時必須同步此表**（行號會漂移，故以函式名與
> 區塊註解為錨點；檔內區塊以 `════` 註解分隔）。

## 檔案結構（由上而下）

| 區塊 | 內容 |
|------|------|
| `<head>` | CDN 載入（PDF.js / pdf-lib / html2canvas / Mammoth）+ 全部 CSS |
| `<body>` 前段 | 工具列（含 ☑ 選取下拉）、About 面板、左右 panel、狀態列、Modal（含 modal-input）、進度條、Toast |
| `<script>` | 以下函式區塊 |

## JS 區塊與函式

| 區塊註解 | 函式 / 變數 | 用途 |
|----------|------------|------|
| 全域狀態 | `state`（mainPages/sourcePages/selectedMain:Set/selectedSource:Map）、`undoStack`、`thumbCache`、`lazyObserver`、`dragMode`/`dragSrcIdx`/`dragSelIdxs` | 核心狀態；selectedSource 的 value 是選取順序 |
| Undo | `snapshotForUndo` `undo` `updateUndoBtn` | 30 步快照制 |
| 工具函式 | `uid` `setStatus` `showProgress` `hideProgress` `showToast` `showModal` `showInputModal` `closeModal` `sanitizeFileStem` | showInputModal 可帶預設值；sanitizeFileStem 清理輸出檔名前綴 |
| 開啟檔案 | `openMainPDF` `openSourceFile` `handleMainFile` `handleSourceFile` `loadMainFile` `loadSourceFiles` `loadSourceFile` `appendSourcePDF` `appendSourceImage` `loadSourceDocx` | 載入主檔/來源檔；DOCX 經 Mammoth → iframe → html2canvas |
| 渲染 | `fileToDataUrl` `renderPageToCanvas` `renderPdfPageToCanvas` `renderImageToCanvas` | 頁面 → canvas |
| 縮圖列表 | `renderMainThumbs` `renderSourceThumbs` | 全量重建 DOM（卡片本體輕量，渲染已懶化） |
| 建立縮圖卡片 | `buildThumbCard` | 卡片 + 懶渲染掛載（`card._lazyRender` + lazyObserver）+ 來源插入頁截角標記（`origin: 'source_insert'`）+ 旋轉鈕 + 拖曳事件（main：多選整組重排；source：插入） |
| 拖曳輔助 | `clearInsertIndicators` `resetDrag` `doSrcInsert` + `left-thumbs`/`right-thumbs` 容器級 dragover/drop | 插入指示線、外部檔案拖入 |
| 選取 | `selectMain` `selectSource` `selectAllSourcePages` `refreshMainSelection` `refreshSourceSelection` `updateMainHeader` `updateSourceHeader` `updateToolbar` | updateToolbar 同時更新按鈕 disabled 與狀態列已選頁數；`selectAllSourcePages` 負責右側來源全選 |
| 批次選取（P8-D） | `toggleSelMenu` `closeSelMenu` `applySelection` `selectAllPages` `invertSelection` `selectOddPages` `selectEvenPages` `parseRangeSpec` `openRangeSelect` | 下拉選單 + 頁碼範圍解析 |
| 刪除 | `deleteSelected` | 多頁刪除 + 確認 Modal |
| 排序（按鈕） | `movePage(dir)` | dir：-1/1/'top'/'bot'；支援多頁整組（P8-A） |
| 插入（按鈕） | `insertSelected` | 依 insert-position select；由右側插入時寫入 `origin: 'source_insert'` |
| Data URL / ZIP | `dataUrlToArrayBuffer` `appendPageToPdfDocument` `makeSinglePagePdf` `crc32` `createZip` | 不用 fetch（CSP 相容）；`createZip` 為內建無壓縮 ZIP writer，不新增第三方依賴 |
| 頁面旋轉 | `rotateDataUrl` `renderPageHighRes` `rotatePage` | PDF 頁旋轉會轉 1200px 點陣圖（K06） |
| 合併 | `mergeSourceToOnePage` | 右側多選垂直拼貼為 A4 寬度單頁；合併頁寫入 `origin: 'source_insert'` |
| 另存 | `saveAsPDF` `exportPagesAsZip` | pdf-lib 合成整份 PDF；個別分頁會逐頁建立 PDF 並 ZIP 下載 |
| 鍵盤 | keydown listener | Ctrl+Z 復原、Ctrl+A 全選、Delete 刪除 |
| 版本資訊 | `toggleAbout` + 外點關閉 listener | About 浮層 |
| 縮圖大小 | `THUMB_SIZES` `cycleThumbSize` | 三段縮放，切換時清快取重渲染 |
| 可拖曳分隔線 | IIFE（splitter mousedown/mousemove/mouseup/dblclick/resize） | P9-3：右側寬度 220px～60%，localStorage 記憶，雙擊重設 |
| 初始化 | 檔尾三行 | updateToolbar / updateUndoBtn / setStatus |
