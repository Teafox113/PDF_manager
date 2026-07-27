# CHANGELOG v1.4（branch_v2 / Fable 開發線）

## v1.4.0-F — 2026-06-11

### 性質
分枝起點版本。程式碼功能與主線 v1.3.0 完全相同，變更集中於版號標示與文件。

### 變更內容

#### 版號與分枝
1. 建立 `branch_v2/` 分枝資料夾，與主線完全隔離
2. 版號制度加入分枝後綴規則：`-F`（Fable 開發線），詳見 VERSION_WORKFLOW.md
3. `version.json` 加入 `branch`、`branch_suffix`、`branch_note` 欄位
4. `pdf_editor.html` 工具列與 About 面板版號更新為 v1.4.0-F

#### 文件同步（修正主線文件落後實況的問題）
5. TASK_CHECKLIST：勾選實際已完成項（P3-4 DOCX、P5-5 拖曳排序、P7-1 Undo、P7-4 離線版），新增 Phase 8 分枝開發項
6. PROJECT_INDEX：全面改寫，移除「DOCX 不支援」等過時敘述
7. KNOWN_ISSUES：K01/K03 移至已解決；新增 K06（旋轉轉點陣圖取捨）、K07（Undo 記憶體）
8. DEV_LOG：補記 v1.1–v1.3 漏記摘要，確立「每次開發必補日誌」規範
9. TEST_REPORT：12 項擴充至 20 項，補 Undo、拖曳重排、DOCX、批次載入、旋轉、合併、離線版測項
10. 新增 BRANCH_EVALUATION.md：完整評估報告與後續開發選項

### 未變更
- 所有功能程式碼（與 v1.3.0 相同）
- build_offline.py（自動讀 version.json，輸出檔名自動帶 -F）
- 第三方函式庫版本
