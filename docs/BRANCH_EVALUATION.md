# 分枝評估報告（branch_v2 / v1.4.0-F）

> 評估日期：2026-06-11
> 評估基準：主線 v1.3.0（pdf_editor.html，1498 行）
> 分枝代號：`-F`（Fable 模型接續開發與修訂線）

---

## 一、程式碼現況評估

### 架構
單一 HTML 檔，Vanilla JS，無框架依賴。結構清晰：state 集中管理、
Undo 快照制（30 步）、縮圖渲染與快取（thumbCache Map）、
拖曳雙模式（thumb-reorder / src-insert）。整體品質良好，適合繼續演進。

### 已實作但檢查清單未勾選的功能（文件落後於程式碼）

| 清單項目 | 實況 |
|----------|------|
| P3-4 DOC/DOCX 支援 | ✅ 已實作（Mammoth.js → iframe 分頁 → html2canvas） |
| P5-5 拖曳排序 | ✅ 已實作（thumb-reorder 拖曳模式） |
| P7-1 Undo 功能 | ✅ 已實作（30 步，Ctrl+Z） |
| P7-4 離線版本 | ✅ 已實作（build_offline.py，函式庫全內嵌） |

### 真正未完成的功能

| 項目 | 說明 | 難度 |
|------|------|------|
| P7-2 多頁拖曳排序 | 拖曳僅支援單頁；多選後拖曳會清空選取（L955 `selectedMain.clear()`） | 中 |
| 多頁同時上移/下移 | `movePage()` 限定 `selectedMain.size === 1`（L1193） | 低 |
| P7-3 大檔效能 | thumbCache 已存在，但每次 `renderMainThumbs()` 全量重建 DOM；100+ 頁會卡 | 中 |
| 縮圖虛擬捲動 | 大檔根本解法，僅渲染可視區域 | 高 |

### 程式碼層面觀察

1. **Undo 快照為淺拷貝**（`{...p}`）：頁面物件含 dataUrl 字串，旋轉後產生新 dataUrl，
   舊快照引用舊字串——行為正確，但大檔時 undoStack 可能佔記憶體（30 步 × 全頁陣列）。
   建議：改存差異（diff）或限制大檔時的步數。
2. **`uid()` 用 Math.random**：碰撞風險極低、內部工具可接受，不必改。
3. **錯誤處理**：載入失敗多以 alert / toast 提示，無全域 error handler。可加。
4. **rotatePage 對 PDF 頁轉 1200px 圖**：旋轉後該頁變成點陣圖，文字不可再選取、
   檔案變大。屬已知取捨，建議記入 KNOWN_ISSUES。

## 二、文件一致性評估

| 文件 | 問題 | 處置 |
|------|------|------|
| TASK_CHECKLIST.md | 4 項已完成未勾（見上表） | ✅ 本分枝已同步 |
| PROJECT_INDEX.md | 寫「DOCX 不支援」「Undo 為下一步」，皆過時 | ✅ 本分枝已改寫 |
| KNOWN_ISSUES.md | K01（DOCX）、K03（離線）已解決仍列為待評估 | ✅ 本分枝已更新 |
| DEV_LOG.md | 只有 2026-06-01 一筆，v1.1–v1.3 無紀錄 | ✅ 補上摘要 + 分枝起點 |
| TEST_REPORT.md | 12 項全部「待測」，且缺 v1.1–v1.3 新功能測項 | ✅ 本分枝擴充至 20 項 |
| CHANGELOG | 規範要求每 MINOR 建新檔，但只有 v1.1；v1.2 / v1.3 缺檔 | ✅ 建 CHANGELOG_v1.4.md，並於其中補記 |
| VERSION_WORKFLOW.md | 無分枝版號規則 | ✅ 已加入 `-F` 後綴規範 |

## 三、流程設計評估與改良

### 維持不變（運作良好）
version.json 單一真實來源、SemVer 升版規則、build_offline.py 自動讀版號輸出。

### 本分枝新增規範
1. **分枝後綴規則**：分枝版號 = `MAJOR.MINOR.PATCH-F`，升版邏輯同 SemVer，
   後綴恆為 `-F`。離線版輸出 `pdf_editor_offline_v1.4.0-F.html`，與主線檔名天然區隔。
2. **分枝隔離**：branch_v2/ 內所有檔案自成一體，不回寫上層主線檔案。
   合併回主線時：人工審查 → 摘除 `-F` 後綴 → 主線升 MINOR。
3. **DEV_LOG 補記制**：每次開發必補一筆（過去 v1.1–v1.3 漏記）。
4. **CHANGELOG 缺檔補救**：v1.2/v1.3 詳情已在 version.json history 與 About 面板，
   不重建舊檔，自 v1.4 起恢復規範。

## 四、後續開發方向選項（待決定）

| 選項 | 內容 | 預估規模 |
|------|------|----------|
| A. 多頁操作補完 | 多選拖曳排序 + 多頁上移/下移（P7-2 + movePage 解鎖） | 中 |
| B. 大檔效能 | DOM 增量更新 + IntersectionObserver 懶渲染（P7-3） | 中 |
| C. 頁面預覽放大 | 點兩下縮圖開大圖預覽（含翻頁） | 小–中 |
| D. 批次工具 | 全選/反選、奇偶頁選取、頁碼範圍選取 | 小 |
| E. Undo 記憶體優化 | 大檔時快照策略調整 | 小 |

建議順序：D（小而實用）→ A → B，C/E 視需求。
