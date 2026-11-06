# Changelog

## v2.14.0-F — 2026-11-05

- PDF.js 3.11.174 → 6.5.438：實際升級主引擎及 Worker；原生 ESM 主模組，file:// 專用 classic Worker 相容橋接，禁止退回主執行緒解析。
- 內嵌 CMap、Foxit／Liberation 2.1.5 OFL 字型、JBIG2／OpenJPEG／QCMS WebAssembly 及 ICC，完全離線。新增套件／資源雜湊與授權原文。
- 保留 connect-src none 與禁止 JavaScript eval；僅允許 wasm-unsafe-eval 供解碼器。未加入 PDF scripting manager／QuickJS／XFA。
- 適配新版文件生命週期，正常、失敗及預覽完成後回收 Worker；處理模組啟動時序及啟動失敗。
- 新版 viewport 已包含 UserUnit，避免再次乘倍；合併 v2.13.1 的旋轉實際紙張尺寸修正。
- 擴增合成回歸，包含 CJK／JPX／ICC／Worker、紙張尺寸、裁切、消去、文字／表格、實際 PDF／ZIP 下載及 120 頁文件。
- 不改寫舊成品；Edge 內建閱讀器 Ctrl＋] 問題仍未確診。

以下為歷史紀錄；舊版本狀態不代表目前版本。


## v2.13.2-F — 本機安全修補版（2026-11-05，未發布）

- 所有產品 PDF.js 載入統一使用 `pdf_security.js` 的 `loadLocalPdf`，僅接受本機位元組，固定 `isEvalSupported: false`、`enableXfa: false`；呼叫者不能透過參數覆寫。這是 Mozilla 對 CVE-2024-4367 的官方緩解方式。
- 離線 CSP 移除 `unsafe-eval`，拒絕主頁與繼承政策的 Blob Worker 執行動態程式碼；仍保留現有內嵌腳本所需的 unsafe-inline，因此不是 Manifest V3 成品。
- 新增純合成安全回歸：入口繞過掃描、選項／URL 防護、真實 DOM 事件觸發 CSP 驗證及 PDF 顯示／文字擷取。
- 沿用已固定雜湊與授權的 PDF.js 3.11.174，並未升級為 6.x，也不宣稱所有依賴均無漏洞；現代主版遷移與 Chrome 版評估見 `docs/CHROME_EXTENSION_ASSESSMENT.md`。
- 包含 v2.13.1 旋轉尺寸修正。不讀取私人測試文件，不同步 Git 工作區、不推送；舊成品保留但沒有回補安全修正，請改用新版。

## v2.13.1-F — 本機測試版（2026-10-22，未發布）

- 修正工具列旋轉 PDF 後把圖片像素當成 PDF 點數，造成整份 PDF／個別分頁紙張尺寸放大的問題。旋轉前記錄可見頁面實際尺寸，90° 旋轉後交換寬高，包含 CropBox、原始旋轉與 UserUnit。
- 圖片頁沿用既有尺寸規則，已有 pageSize 的頁面保留實際尺寸；連續旋轉不累積放大。完成轉圖後才記錄復原，轉圖失敗不增加復原步數。
- 新增純合成 `tests/test_rotation_size.cjs`，涵蓋旋轉、偏移裁切框、尺寸單位、復原／重做與 PDF／ZIP 匯出。
- 本版仍沿用旋轉頁點陣化，不恢復舊版已放大的文件，不代表修復 Edge 的 Ctrl＋] 快捷鍵或強制開啟為 100%。沒有新增第三方依賴；僅本機交付，未推送 Git。

## v2.13.0-F（2026-10-21）

本次正式更新整合 v2.12.0-F 的裁切／尺寸校正與 v2.13.0-F 操作打磨。v2.12 未獨立發布；下方「本機候選／未發布」為開發歷史。

### 新增與改善

- 頁面裁切支援 A4、B4 JIS／ISO、橫直向、自訂框、毫米位置／尺寸及置中；固定框只裁不縮放，超界時明確拒絕。
- 依同一文件的另一頁尺寸等比例縮放、置中補白，保留原 PDF 文字／向量；支援旋轉與 CropBox 位移，不拉伸或裁掉內容。
- 裁切結果構圖預覽、自訂框移動／重畫、1／10／0.1 mm 鍵盤微調與完整頁重設。
- Esc／pointercancel／意外失去 pointer capture 還原未完成拖曳；取消後舊非同步預覽不會重開對話框。
- 具體欄位錯誤、aria-invalid、處理階段進度及估計取樣 dpi；無效輸入不顯示 NaN。失敗保留草稿與文件，支援工作階段復原／重做。
- 校正後安全重建其他頁指向該頁的普通內部連結，避免帶回舊頁與隱藏資源。未新增第三方執行依賴。

### 驗證與限制

- 新增純合成 `test_page_geometry.cjs`、`test_geometry_polish.cjs`；幾何、取消與錯誤復原、既有編輯／匯出／超連結／資源清理回歸通過，詳細範圍見 `docs/TEST_REPORT.md`。
- 裁切只將受影響頁面重建為圖片，該頁文字無法搜尋；其他頁不圖片化。校正保留原 PDF 文字／向量，但不含 OCR。兩種操作均將該頁新增物件定稿並移除該頁連結。
- 共用原圖或不支援結構採保守拒絕。非全文件個資清理，沒有自動儲存、邊緣偵測或去傾斜；進度不是精確耗時預估，套用期間不支援中途取消。
- 沿用已測試離線成品，不重建或覆蓋舊版；私人測試 PDF、擷取物與測試截圖不發布。

### English summary

- Crop pages to A4, JIS/ISO B4 or custom millimeter rectangles; fit a page proportionally to another page in the same document with centered margins.
- Preview crop composition, move/redraw/reset the selection, and nudge it by 1/10/0.1 mm. Interrupted drags roll back; field diagnostics and staged progress make failures explicit.
- Crop rasterizes only the affected page; fitting preserves original PDF text/vectors. Added objects are flattened and links removed on the affected page. Other pages retain their text.
- Synthetic regression coverage expanded without new runtime dependencies. Unsupported/shared-image structures are refused; no OCR, autosave or document-wide sanitization. Original documents and older builds remain unchanged.

## v2.12.0-F — 本機審閱候選（2026-10-21）

- 新增頁面裁切：A4、JIS／ISO B4、橫直向、自訂拖曳框、毫米位置／尺寸與置中；固定框只裁不縮放，超出頁面拒絕。
- 裁切沿用消去預檢與整份輸出資源清理；只重建裁切頁圖片，不保留框外像素，其他頁不圖片化。複雜結構／共用原圖仍保守拒絕。
- 新增依同文件另一頁等比例置中校正，處理旋轉與 CropBox 位移，保留原 PDF 文字／向量。該頁新增物件定稿，連結移除；指向該頁的普通連結改整頁適配。
- 新增預覽對話框、鍵盤與輸入防護、失敗不提交及復原／重做；新增本專案來源模組 page_geometry.js，未新增第三方套件。未發布 GitHub，不覆蓋舊版或私人文件。

## v2.11.0-F（2026-10-19）

使用者授權發布，整合下方 v2.9.0-F、v2.10.0-F 審閱版功能；以下「未發布」敘述為當時開發紀錄。

- 來源 PDF／圖片／單一 DOCX 整批成功才替換，失敗保留舊來源及選取；圖片先驗證解碼，來源 PDF 釋放解析資源，DOCX 失敗不跳頁並清除臨時 iframe。
- 不支援格式、舊 DOC、多份 DOCX 明確拒絕；批次失敗提示位置，不列出文件內容。載入與匯出互斥。
- PDF／ZIP 增加安全檢查點取消及 Esc／Tab／Enter／Space 操作，取消不下載、不更新已匯出標記；進度條提供 ARIA 語意。PDF 檔名使用既有清理函式。
- 新增純合成輸入／輸出測試，包含 120 頁文字文件；未新增依賴，未讀取私人文件，未發布 GitHub。非立即中斷、非自動儲存或完整商用品質認證。

## v2.10.0-F — 本機審閱候選（2026-10-19）

- 復原／重做共用深層物件快照與版本標記；新編輯清除重做分支。未修改文字／單純物件選取不建立快照，拖曳或縮放於真正變更時才記錄一次。
- 未匯出修改狀態、更換文件確認與 beforeunload 提醒；主文件先完整解析，成功才原子替換，失敗保留原工作階段。
- 匯出固定快照與 UI 鎖定，避免重複啟動與編輯混入；失敗解鎖。下載 Blob 延後釋放，提示使用者確認實際存檔。
- 頁內文字即時字數／草稿／錯誤提示，拒絕不合法字級及框寬；主要套用按鈕加強視覺層級。
- 不透明編輯背景、自適應頁面寬度、可捲動格式工具列、避免重複尺寸重繪；確認視窗 Esc 取消、Tab 焦點循環與焦點還原。
- 新合成工作流程測試包含失敗復原及消去後重做的輸出，既有私人測試文件不使用、不發布。未改第三方依賴或 Push。

## v2.9.0-F — 本機審閱候選（2026-10-19）

- 新增文字與編修文字改為頁面上的原生文字框，不再彈出文字輸入對話框；表格維持既有儲存格編輯器。
- 文字工具列：本機字型、字級、顏色、粗斜體、底線、對齊、行距及框寬；格式目前套用整框。
- Ctrl+B／I／U、Ctrl+Enter 套用、Esc 取消；保留原生文字選取、貼上與輸入法鍵盤隔離。
- 切換工具／完成編輯先套用草稿；清空既有文字移除該物件，支援頁面復原。文字超出頁面拒絕套用。
- 修正物件重繪造成雙擊未被辨識；字型基線與行距同步至匯出圖片。無新增第三方依賴，未發布 GitHub。

## v2.8.1-F — 2026-10-16

- 包含下方 v2.8.0-F 開發候選的頁面編輯功能；v2.8.0-F 未獨立公開發布。

- 普通 HTTP(S)／mailto 與明確內部跳頁連結不再阻擋其他頁消去。
- 複製頁面前移除原始註解參照，輸出時只重建經驗證的連結；內部目的地對應到實際輸出頁，避免帶回已消去的原始頁面與隱藏資源。
- 保留連結矩形、邊框與顏色等支援的外觀資料；刪除／ZIP 未包含的目的頁不保留失效跳頁連結。
- 拒絕訊息保留主 PDF 頁碼與原因，中英文及 PDF／ZIP 輸出一致；不顯示文件文字、網址或私有路徑。
- 新增純合成超連結測試；使用者文件僅於本機記憶體測試，不納入程式碼或成品。

## v2.8.0-F — 未發布候選（2026-10-16）

- 新增左側選頁／雙擊頁面編輯、剪貼簿圖片與表格、新增文字、儲存格與列欄編輯，中英文介面。
- 新增內容可在工作階段修改與復原；輸出為圖片覆蓋，不更動原有 PDF 文字。
- `page_editor.js`、`pdf_resource_cleaner.js` 為本專案模組，由離線建置器內嵌；未加入新的第三方發布依賴。
- 改以編輯頁圖片化搭配自製資源清理，移除未使用的跨頁共用資源與不可達物件；其他頁不圖片化。
- 操作前驗證完整輸出，失敗不修改狀態；PDF／ZIP 輸出再檢查。仍被使用的共用原圖、註解與不支援結構採保守拒絕，不誤刪其他頁。
- 新增合成文件測試，涵蓋隱藏圖片、巢狀 Form、復原、重新插入、實際框選、旋轉與偏移裁切框。

## v2.7.1-F — 2026-10-08

- 修正含 90°／270° 旋轉資訊的 PDF，印章在頁面中途撞到隱形邊界的問題。
- 印章預覽、縮圖與匯出共用可視頁面座標，支援旋轉及偏移裁切框；保留原頁向量內容。
- 印章拖曳、縮放與裁切依畫面位置換算，校正介面縮放與捲動造成的偏差。
- 新增旋轉頁面印章回歸測試，使用合成資料，不包含使用者 PDF。

## v2.7.0-F — 2026-09-21

- 以 v2.6.2-F 整合發布，包含圖片／PDF 蓋章、裁切、縮圖佇列與來源多選拖曳。
- 新增繁體中文／English 即時介面切換，記住語言與佈景偏好；不修改文件內容或使用者檔名。
- 新增鈦金深色、紙感淺色、深海藍、森林綠。
- 新增英文 README，保留使用者修訂的用途及圖片蓋章限制說明。
- dingbat-to-unicode 1.0.1 改附作者確認適用舊版的正式授權。
- 修正離線建置版號重複 -F、重複 helper 及 Windows cp950 狀態輸出問題。


本檔記錄適合發布頁顯示的版本摘要。完整開發紀錄位於 `docs/`。

## v2.2.0-F — 2026-06-30

- 新增「個別分頁」功能。
- 可將主 PDF 每頁輸出成獨立 PDF 並打包為 ZIP。
- 自動依總頁數補零編號。
- 支援中文檔名前綴與 ZIP 內 UTF-8 檔名。
- 使用內建無壓縮 ZIP writer，沒有新增第三方依賴。

## v2.1.x-F

- 新增可拖曳的左右面板分隔線。
- 儲存面板寬度設定。
- 新增右側來源頁全選。
- 改善插入來源頁的視覺標記與預設顯示比例。

## v2.0.0-F

- 更新整體鈦金屬主題與互動視覺。

## v1.5.x-F

- 新增批次選取、多頁移動、多頁拖曳排序及縮圖懶渲染。
- 修正內部拖曳被誤判為開啟外部 PDF。

詳細內容：

- `docs/CHANGELOG_v1.1.md`
- `docs/CHANGELOG_v1.4.md`
- `docs/CHANGELOG_v1.5.md`
- `docs/CHANGELOG_v2.0.md`
- `docs/CHANGELOG_v2.1.md`
- `docs/CHANGELOG_v2.2.md`
