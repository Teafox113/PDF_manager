# 版號管理工作流程（branch_v2 分枝版）

## 分枝版號規則（本分枝適用）

- 分枝版號格式：`MAJOR.MINOR.PATCH-F`（`-F` = Fable 開發線，後綴恆定不變）
- 升版邏輯與主線 SemVer 完全相同，只動數字、不動後綴
  - 例：修 bug → 1.4.0-F → 1.4.1-F；加功能 → 1.4.x-F → 1.5.0-F
- 離線版輸出檔名自動帶後綴；目前為 `release-assets/pdf_editor_offline_v2.2.0-F.html`
- **發布隔離**：本資料夾是發布候選，原始開發檔仍保留於上層專案，不回寫或覆蓋
- **合併回主線**：人工審查 → 摘除 `-F` 後綴 → 主線升一級 MINOR → 補主線 CHANGELOG

## 改版前備份制度（必做）

**每次修改 `pdf_editor.html` 前，先備份現行版本**，失敗可立即還原：

```
backups/pdf_editor_v{現行版號}.html
backups/version_v{現行版號}.json
```

規則：
1. 動手改程式前，複製現行 `pdf_editor.html` → `backups/pdf_editor_v{舊版號}.html`（若同名已存在表示已備份過，跳過）
2. 改壞時直接以備份覆蓋還原
3. backups/ 只保留最近 3 個版本，更舊者可刪（CHANGELOG 已有紀錄）

## Token 控制規範

- About 面板僅保留**最近 2 版**變更說明，舊的移至 CHANGELOG 檔
- 開發時先查 `FUNCTION_MAP.md` → grep 函式名定位 → 只讀相關段落，避免全檔讀取
- 任何情況下不讀取 `pdf_editor_offline_*.html`（2.8MB 內嵌函式庫）
- 新增/刪除函式時必須同步更新 `FUNCTION_MAP.md`

## 版號規則（SemVer）

格式：`MAJOR.MINOR.PATCH`

| 版號位 | 升版時機 | 範例 |
|--------|----------|------|
| PATCH  | 臭蟲修正、文字修正、UI 微調（不影響功能） | 1.1.0 → 1.1.1 |
| MINOR  | 新功能加入、顯著改善（向下相容） | 1.1.x → 1.2.0 |
| MAJOR  | 介面大改版、架構重寫、破壞性變更 | 1.x.x → 2.0.0 |

---

## 每次修改的標準操作程序

1. **確認要升哪一位**（參照上表）
2. **更新 `version.json`**
   - 修改 `version`
   - 更新 `release_date`（今天日期）
   - 在 `history` 陣列最前方加入新紀錄
3. **更新 `pdf_editor.html`**
   - 工具列按鈕：`FloofyFox · PDF Editor vX.Y.Z`
   - About 面板 `about-version`：`PDF 頁面編輯器 vX.Y.Z`
   - About 面板變更說明區塊
4. **更新 `CHANGELOG_v{MAJOR}.{MINOR}.md`**（MINOR/MAJOR 升版時建新檔）
5. **重新執行 `python build_offline.py`** 產出最新離線版

---

## 輸出檔名規則

`build_offline.py` 自動從 `version.json` 讀取版號，輸出：

```
pdf_editor_offline_v{version}.html
```

範例：
- v1.1.0 → `pdf_editor_offline_v1.1.0.html`
- v1.2.0 → `pdf_editor_offline_v1.2.0.html`

---

## 版號集中管理位置

| 檔案 | 角色 |
|------|------|
| `version.json` | **唯一真實來源**，所有版號從此讀取 |
| `pdf_editor.html` | 開發版，版號手動同步 |
| `build_offline.py` | 讀取 version.json，自動注入離線版 |
| `CHANGELOG_*.md` | 版本記錄存檔 |

---

## 快速判斷：要升哪一位？

```
修正了一個 bug？             → PATCH (x.x.+1)
加了一個新功能？             → MINOR (x.+1.0)
改了介面 / 架構大改？        → MAJOR (+1.0.0)
只改文字 / 授權說明？        → PATCH
新增第三方函式庫？           → MINOR
移除功能或 API 不相容？      → MAJOR
```
