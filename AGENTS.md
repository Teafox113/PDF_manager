# AGENTS.md

## 專案目標

維護一個在瀏覽器本機執行、可刪除與插入 PDF 頁面的單檔應用程式。

## 工作範圍

- 本資料夾是 GitHub 發布候選。
- 不得修改、搬移、重新命名、刪除或覆蓋上層原始專案檔案。
- 所有發布修訂只在本資料夾內進行。

## 來源與版本

- `pdf_editor.html` 是主程式來源。
- `version.json` 是版號唯一真實來源。
- `build_offline.py` 依 `version.json` 產生離線版。
- 發布版本、程式顯示版號、CHANGELOG 與檔名必須一致。

## 建置規則

- 預設執行 `python build_offline.py`。
- 產出位置固定為 `release-assets/`。
- 同名輸出存在時不得自動覆寫；只有使用者明確同意後才可加 `--force`。
- `release-assets/*.html` 是 GitHub Release 附件，不提交到 Git 歷史。

## 修改要求

- 保持 UTF-8 編碼。
- 新增或刪除函式時同步更新 `docs/FUNCTION_MAP.md`。
- 功能或限制變動時同步更新 README、CHANGELOG、KNOWN_ISSUES 與 TEST_REPORT。
- 不加入 API Key、Token、密碼、私鑰、個資、測試 PDF 或其他機密資料。
- 不加入硬編碼的本機絕對路徑。

## 驗證要求

- 檢查 Python 與 JSON 語法。
- 掃描絕對路徑及機密字串。
- 依 `docs/TEST_REPORT.md` 進行主要功能測試。
- 離線版需在斷網狀態確認沒有 CDN 請求。

