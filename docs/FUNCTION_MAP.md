# FUNCTION_MAP — pdf_editor.html 函式索引

## v2.11.0-F 來源交易與匯出取消

- `loadSourceFiles`：驗證批次格式、鎖定操作，以 nextPages 暫存；成功才替換，失敗保留原狀並統一清理。
- `appendSourcePDF`／`appendSourceImage`／`loadSourceDocx`：接受 target 陣列；PDF 解析後 destroy，圖片先解碼，DOCX 任一頁失敗即拒絕整批。
- `beginExport`：鎖定介面並建立當次取消 task、顯示及聚焦取消按鈕。
- `requestExportCancel`：設定取消旗標，顯示等待目前步驟完成。
- `exportCheckpoint`：讓出事件迴圈後檢查旗標並拋出專用取消錯誤；置於頁間及下載之前。
- `reportExportCancelled`：顯示保留編輯且無下載的結果，不修改文件或版本。
- `saveAsPDF`／`exportPagesAsZip`：使用固定快照與取消檢查；只有下載成功呼叫後更新匯出版本。
- `showProgress`／`setDocumentBusy`：進度 ARIA、保留取消訊息、結束時清理 task 與恢復焦點。

## v2.8.1-F 超連結與診斷

- `readOrdinaryLinks`：驗證普通連結白名單、矩形／邊框／色彩、URI 協定與明確目的頁，回傳無原始 PDF 參照的資料。
- `pdfLinkIdentity`：來源工作階段識別，讓消去後圖片頁仍可作為內部跳頁目的地，不保留原始 PDF 位元組。
- `recordOutputLinks`／`rebuildOutputLinks`：記錄實際輸出頁並重建安全連結；不在輸出內的目的地不複製。
- `pdfCleanError(reason,page)`／`pdfCleanAt`：保留具類別及頁碼的診斷，產生中英訊息，不包含文件文字或 URI。
- `appendPageToPdfDocument(..., cleanLinks)`：清理模式中，原始註解暫時移出複製範圍，再於 finally 還原記憶體來源，避免隱藏頁被跟隨目的地複製。
- `saveEditedPdf(doc,pages,outputPages)`：先重建連結，再清理與輸出；單頁 ZIP 提供實際頁面映射保留主 PDF 頁碼。

## v2.8.0-F 未發布候選：page_editor.js

- `pt`、`refreshPageEditorLanguage`：新增工具與對話框中英文字串。
- `pageEditBusy`、`pageEraseActive`、`refreshPageObjectControls`、`resetPageEditorTools`、`runPageTask`、`pageEditError`：編輯狀態、鎖定、錯誤處理與控制項。
- `validateRows`、`parseClipboardTable`：表格尺寸限制、惰性 HTML 解析與 TSV 轉換，不插入外部 HTML。
- `openContentEditor`、`closeContentEditor`、`renderTableGrid`、`changeTableShape`、`editPageObject`：文字／表格草稿與儲存格列欄編輯。
- `wrapPageText`、`renderPageContent`、`applyContentEditor`：Canvas 渲染新增內容並保留工作階段編輯資料。
- `acceptPageClipboard`、`pastePageClipboard`：圖片／表格／文字貼上與剪貼簿權限降級。
- `togglePageErase`、`erasePointer`、`erasePageArea`：框選與單頁圖片化；檢查來源、預檢完整輸出、原子提交候選頁面、保留工作階段復原。
- `undoPageEdit`、`handlePageEditorKey`：編輯器復原與鍵盤事件隔離。
- `build_offline.py`：建置時將本專案 `page_editor.js` 內嵌；第三方依賴仍依既有 hash 驗證。

## v2.8.0-F 自製 pdf_resource_cleaner.js

- `pdfCleanError`：一致且不包含文件內容的拒絕錯誤。
- `pdfContentUsage`：辨識 PDF 名稱、字串、數字、陣列、字典與操作符，收集命名資源使用；不支援語法直接拒絕。
- `pdfImageFingerprints`：原始圖片串流 SHA-256，保守檢查原圖是否仍存在於輸出。
- `assertErasureSources`：來源大小、加密解析、表單／簽章／圖層／註解預檢。
- `cleanPdfResources`：分頁獨立資源字典、遞迴 Form 使用分析、不可達物件回收；不修改使用中的原始圖片。
- `saveEditedPdf`：所有 PDF／ZIP 出口的清理入口，無消去文件沿用既有輸出；清理錯誤直接阻止輸出。
- 私有輔助 `skip`／`token`、`keysWithin`／`decode`／`usage`／`font`／`form`／`prune`／`walk`：詞彙解析、支援範圍限制、遞迴與可達性檢查。

## v2.7.1-F 蓋章座標修正

- `getPdfPageGeometry`：以 PDF.js 的可視頁面（CropBox／Rotate）取得尺寸與回到 PDF 原生座標的矩陣。
- `getPageNaturalSize`：PDF 回傳可視尺寸；圖片沿用圖片尺寸。
- `stampPointer`：滑鼠螢幕座標換成頁面座標，包含 CSS zoom 與捲動位移。
- `appendPageToPdfDocument`：蓋章時套用可視座標轉換，保留原 PDF 頁面內容與旋轉資訊。

## v2.7.0-F 新增與整合

- `I18N` / `text` / `template`：中英文詞典及參數插值；全域 `t`、`tr` 為捷徑。插值不作 HTML 解析，不翻譯文件資料。
- `rememberStatic`：只在 DOMContentLoaded 收集介面文字節點及 title / aria-label，不遍歷 iframe 或授權原文。
- `setLanguage`：白名單語言、偏好儲存、更新介面；儲存失敗可繼續使用。
- `refreshInterfaceLanguage` / `createEmptyHint`：更新標題、頁碼、提示及控制列，不重建 canvas 或復原狀態。
- `theme-controller` / `applyTheme`：四套主題與偏好回退。
- v2.6.2-F 整合的主要函式：`openStampEditor`、`closeStampEditor`、`openStampFile`、`handleStampFile`、`renderStampOverlays`、`updateStampControls`、`toggleCropMode`、`resetActiveStampCrop`、`deleteActiveStamp`、`renderPagePreviewToCanvas`、`drawStampsOnCanvas`、`cloneStamp`、`clonePageForUndo`；縮圖佇列 `enqueueThumbRender`、`pumpThumbRenderQueue`、`runThumbRenderJob`、`resetThumbRendering`。
- 以下索引來自早期發布版，蓋章等新增函式請以上述名稱定位，避免依賴舊行號。


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
# v2.9.0-F 頁內文字新增函式（2026-10-19）

- `pageTextFont(content)`：限定本機字型，建立 CSS／Canvas 共用字型字串。
- `readInlineText()`：讀取頁內文字與整框格式。
- `openInlineText(content, stampId)`：初始化頁面內 textarea 與文字工具列，保留文字框左上位置。
- `updateInlineText()`：依頁面比例、格式與換行更新頁內預覽。
- `openContentEditor()`：文字改走頁內模式，表格沿用對話框。
- `applyContentEditor()`：同步回傳套用結果；拒絕越界、空內容刪除該文字物件，支援復原。
- `closeContentEditor()`：取消草稿、還原控制項位置與舊物件顯示。
- `renderPageContent()`：支援字型、粗斜體、底線、對齊、行距及框寬，匯出定稿圖片。

# v2.10.0-F 工作流程打磨（2026-10-19）

- `redo()`：恢復重做快照與 revision；`snapshotForUndo`／`undo` 維護雙向紀錄。
- `hasUnexportedChanges()`／`refreshSessionState()`：依文件 revision 與草稿顯示未匯出狀態。
- `setDocumentBusy(value)`：載入與匯出的 UI／重複操作互斥及焦點還原。
- `downloadDocument(bytes,type,name)`：交付瀏覽器下載並延遲釋放 Blob URL。
- `loadMainFile(file,confirmed)`：確認捨棄後解析，成功才替換。
- `pageDraftChanged()`／`inlineTextIssue(height)`：草稿異動與即時格式／越界檢查。
- `undoPageEdit(isRedo)`：在頁面編輯器維持目前頁 ID 的復原或重做。
- `renderStampEditor()`：暫存 canvas／sequence 驗證後提交，依工作區寬度呈現。
