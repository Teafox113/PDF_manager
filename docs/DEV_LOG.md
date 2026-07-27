# 開發日誌（branch_v2）

## 2026-06-30 — v2.2.0-F：個別分頁存檔 ZIP

### 本次完成
- 工具列新增「⤓ 個別分頁」按鈕
- 存檔前以 Modal 詢問檔名前綴，預填目前主 PDF 檔名（去除 .pdf）
- 將左側所有頁面逐頁輸出為單頁 PDF，檔名自動加 01/02/03 編號
- 內建無壓縮 ZIP writer（CRC32 + Central Directory），不新增第三方依賴
- 抽出 `appendPageToPdfDocument()`，讓整份另存與個別分頁共用頁面輸出邏輯
- 改版前已備份 backups/pdf_editor_v2.1.4-F.html

### 修改檔案
- pdf_editor.html（v2.1.4-F → v2.2.0-F）、version.json、CHANGELOG_v2.2.md、DEV_LOG.md、TASK_CHECKLIST.md、TEST_REPORT.md、FUNCTION_MAP.md

### 測試結果
- node --check 通過；T34/T35 待使用者實測

---

## 2026-06-17 — v2.1.4-F：右側來源插入頁截角標記

### 本次完成
- 左側縮圖若頁面由右側來源插入或合併產生，右下角顯示冰鈦藍截角標記
- 插入資料新增 `origin: 'source_insert'`，避免用 `sourceType` 判斷造成旋轉頁誤判
- 改版前已備份 backups/pdf_editor_v2.1.3-F.html

### 修改檔案
- pdf_editor.html（v2.1.3-F → v2.1.4-F）、version.json、CHANGELOG_v2.1.md、TASK_CHECKLIST.md、TEST_REPORT.md、FUNCTION_MAP.md

### 測試結果
- node --check 通過；T33 待使用者實測

---

## 2026-06-17 — v2.1.3-F：右側來源全選按鈕

### 本次完成
- 右側來源控制區新增「✓ 全選來源頁」按鈕
- 載入來源檔後啟用，按下後依來源頁面順序建立 selectedSource 選取順序
- 改版前已備份 backups/pdf_editor_v2.1.2-F.html

### 修改檔案
- pdf_editor.html（v2.1.2-F → v2.1.3-F）、version.json、CHANGELOG_v2.1.md、TASK_CHECKLIST.md、TEST_REPORT.md、FUNCTION_MAP.md

### 測試結果
- node --check 通過；T32 待使用者實測

---

## 2026-06-11 — v2.1.2-F：修正縮放後底部被擠出（使用者回報）

### 本次完成
- 修正 zoom 1.1 放大 100vh 導致底部功能區超出畫面：body 高度改 calc(100vh / 1.1)
- 改版前已備份 backups/pdf_editor_v2.1.1-F.html

### 修改檔案
- pdf_editor.html（v2.1.1-F → v2.1.2-F，僅 CSS 一處）、version.json、CHANGELOG_v2.1.md、TEST_REPORT.md

### 測試結果
- node --check 通過；T31 補充驗收點：底部狀態列與右下按鈕完整可見

---


## 2026-06-11 — v2.1.1-F：全介面預設放大 110%

### 本次完成
- body zoom 1.1（字型/按鈕/縮圖全等比放大，等同 Ctrl+滾輪一格）
- 分隔線拖曳座標校正：mousemove/clampW/resize 除以 UI_ZOOM（自動讀 computed zoom）
- 改版前已備份 backups/pdf_editor_v2.1.0-F.html

### 修改檔案
- pdf_editor.html（v2.1.0-F → v2.1.1-F）、version.json、CHANGELOG_v2.1.md、TEST_REPORT.md（T31）

### 測試結果
- node --check 通過；T31 待使用者實測

---


## 2026-06-11 — v2.1.0-F：可拖曳分隔線

### 本次完成
- 左右面板分隔線可拖曳自訂比例（220px～視窗 60%）、雙擊重設 320px、
  localStorage 寬度記憶（不可用時靜默略過）、視窗縮放防呆
- 改版前已備份 backups/pdf_editor_v2.0.0-F.html

### 修改檔案
- pdf_editor.html（v2.0.0-F → v2.1.0-F：CSS #splitter、HTML 分隔線元素、JS IIFE 區塊）
- version.json、CHANGELOG_v2.1.md（新建）、TASK_CHECKLIST.md、TEST_REPORT.md（T30）、FUNCTION_MAP.md

### 測試結果
- node --check 通過；T30 待使用者實測

---


## 2026-06-11 — v2.0.0-F：鈦金屬 iPhone 風格介面大改版

### 本次完成
- 提出四案配色（石墨玻璃/午夜靛/太空灰紫/鈦金屬）附視覺預覽，
  使用者選定：鈦金屬 × 低調質感 × 線性符號
- 全域色盤映射 Catppuccin → Titanium（21 組色碼，replace_all 一次到位）
- iOS 質感：毛玻璃（工具列/選單/About/Toast/進度框）、膠囊按鈕、
  主按鈕漸層、卡片微漸層 + 選取光暈、髮絲線 0.5px、2.2% 噪訊紋路（SVG data URI）
- emoji 圖示全面換線性符號（含 JS 動態字串）
- 依版號規則「介面大改版 → MAJOR」升 v2.0.0-F

### 修改檔案
- pdf_editor.html（v1.5.1-F → v2.0.0-F，純視覺層，JS 邏輯未動）
- version.json、CHANGELOG_v2.0.md（新建）、TEST_REPORT.md（T28-T29）、TASK_CHECKLIST.md
- backups/pdf_editor_v1.5.1-F.html（改版前備份）

### 測試結果
- node --check 通過；視覺驗收待使用者回報（T28-T29）

### 下一步
- 使用者視覺驗收 → 微調（若需要）→ build_offline.py 打包 v2.0.0-F 離線版

---


## 2026-06-11 — v1.5.1-F：修正拖曳重排誤觸讀檔（使用者回報）

### 本次完成
- 修正左側拖曳重排時誤觸「拖曳 PDF 至此開啟」：Chromium 拖曳含 img 縮圖時
  types 自帶 'Files'，改以 dragMode 旗標優先判斷內部拖曳；
  重排放開在空白區改為取消（原本會誤把縮圖當 PDF 載入）；右側同步防護
- 改版前已備份 backups/pdf_editor_v1.5.0-F.html

### 修改檔案
- pdf_editor.html（v1.5.0-F → v1.5.1-F）、version.json、CHANGELOG_v1.5.md、
  TEST_REPORT.md（新增 T27）、KNOWN_ISSUES.md

### 測試結果
- node --check 通過；T27 待使用者實測

---


## 2026-06-11 — v1.5.0-F：批次選取、多頁操作、懶渲染

### 本次完成
- **評估**：單檔肥大化/token 成本分析（結論：線性成長可控）、UI 設計檢視 → 已回報
- **P8-D 批次選取**：工具列「☑ 選取 ▾」下拉群組（全選 Ctrl+A/反選/奇偶頁/頁碼範圍）、
  showInputModal 輸入式 Modal、parseRangeSpec 範圍解析、狀態列顯示已選頁數
- **P8-A 多頁操作**：movePage 重寫支援多頁整組移動；多選拖曳重排（整組）；
  順帶修掉原 drop 處理器內 clear 後查詢的死邏輯
- **P8-B 懶渲染**：IntersectionObserver（rootMargin 300px），未快取縮圖進入可視區才渲染；
  卡片移除時 unobserve 防洩漏
- **流程**：建立 backups/ 改版前備份制度（已存 v1.4.0-F 原檔）；
  About 面板改為僅保留最近 2 版；新增 FUNCTION_MAP.md 函式索引與 token 控制規範

### 修改檔案
- pdf_editor.html（v1.4.0-F → v1.5.0-F，約 +180 行）
- version.json、CHANGELOG_v1.5.md（新建）、FUNCTION_MAP.md（新建）、
  VERSION_WORKFLOW.md、TASK_CHECKLIST.md、KNOWN_ISSUES.md、TEST_REPORT.md
- backups/pdf_editor_v1.4.0-F.html（新建備份）

### 測試結果
- JS 語法檢查通過（node --check）；功能測試待使用者回報（TEST_REPORT T21–T26）

### 下一步
- 使用者實測 v1.5.0-F → 執行 build_offline.py 打包離線版
- 候選：P8-C 預覽放大、P8-E Undo 記憶體、UI 改良（排序鈕收合/鍵盤導航/可調分隔線）

---


## 2026-06-11 — v1.4.0-F 分枝建立（branch_v2）

### 本次完成
- 自主線 v1.3.0 建立 branch_v2 分枝（Fable 開發線，版號後綴 `-F`）
- 完整評估程式碼與文件，產出 `BRANCH_EVALUATION.md`
- 文件同步實況：TASK_CHECKLIST 勾選漏記項（P3-4/P5-5/P7-1/P7-4）、
  PROJECT_INDEX 改寫、KNOWN_ISSUES 更新（K01/K03 移至已解決，新增 K06/K07）
- VERSION_WORKFLOW 加入分枝版號規則
- TEST_REPORT 擴充至 20 項（補 v1.1–v1.3 新功能測項）
- 建立 CHANGELOG_v1.4.md

### 修改檔案
- branch_v2/ 全部檔案（與主線隔離）

### 下一步
- 與使用者確認 P8 開發優先序（A 多頁操作 / B 大檔效能 / C 預覽放大 / D 批次選取 / E Undo 優化）

---

## 補記（主線漏記之版本紀錄摘要）

- **2026-06-09 — v1.3.0**：右側複數頁選取後合併為左側一頁（垂直拼貼，A4 寬度）
- **2026-06-09 — v1.2.0**：右側多檔批次載入（PDF/圖片混合）、左側縮圖旋轉（↺↻，含 Undo）
- **2026-06-08 — v1.1.0**：CSP 資安加固、第三方授權聲明、atob() 修正 fetch 問題、離線版打包
- 規範提醒：自 v1.4.0-F 起，每次開發必補一筆開發日誌

---

## 2026-06-01 — Phase 0~6 初版完成

### 本次完成
- 建立單一 HTML 檔案架構
- 左右分割 UI（左：主 PDF，右：來源檔案）
- 頂部工具列（開啟、刪除、排序、另存）
- 底部狀態列
- 左側：開啟主 PDF + 縮圖顯示（PDF.js）
- 右側：開啟來源 PDF 或圖片 + 縮圖顯示
- 插入功能（before/after/first/last）
- 刪除功能（含確認 Modal）
- 排序功能（上移/下移/移到最前/最後）
- 另存新檔（pdf-lib，含圖片轉 PDF 頁面）
- 拖曳上傳（左側接 PDF，右側接 PDF/圖片）
- 深色主題 UI

### 修改檔案
- `pdf_editor.html`（新建）
- `PROJECT_INDEX.md`（新建）
- `DEV_LOG.md`（新建）
- `TASK_CHECKLIST.md`（新建）
- `KNOWN_ISSUES.md`（新建）
- `TEST_REPORT.md`（新建）

### 測試結果
- 待使用者回報

### 發現問題
- 圖片插入時 data URL 轉 fetch 方式在某些瀏覽器可能有 CORS 問題，已改用 fetch(dataUrl)
- DOC/DOCX 格式無法在純瀏覽器處理，已加入提示訊息

### 下一步
- 使用者測試基本功能
- Phase 7：優化 UI、加入 Undo、多頁拖曳排序
