# 維護交接

更新：2026-09-21。發布版本：v2.7.0-F。

## 已完成

- 以 v2.6.2-F 為基底整合四套主題、繁體中文／English 即時切換及偏好儲存。
- 中文 README 保留使用者修改的用途與蓋章說明；新增 README.en.md，兩份互連。
- 使用者編修的 README_GITHUB_DRAFT.md 與原始 branch_v2 保留，不納入新提交。
- dingbat-to-unicode 1.0.1 附正式 BSD-2-Clause（2021, Michael Williamson）；保留作者確認舊版適用的永久連結。
- 新離線成品及 SHA-256 已更新，舊 v2.2.0-F 成品保留。
- 中英文、四主題、主要 PDF／圖片／印章／輸出及斷網測試結果見 docs/TEST_REPORT.md。

## Git 狀態與下一步

- 發布工作區為使用者指定的 PDF_manager 本機 Git 儲存庫，main 分支。
- 使用者已明確同意建立 Public 儲存庫，目標為 https://github.com/Teafox113/PDF_manager，並開啟 Issues 供聯繫。
- 本機既有四筆未發布提交的作者／提交者信箱已改為 GitHub noreply；原始歷史 bundle 備份留在發布工作區外，不得上傳該私人備份。
- 此儲存庫的 user.email 已設為 212410984+Teafox113@users.noreply.github.com；其他專案及 GitHub 收信設定未改動。另一台電腦也需在該專案自行設定相同信箱。
- 中英文 README 新增 Issues 聯繫說明。首次 Push 的實際結果以 git status、遠端 main 與發布檢查表為準。
- 不可將其他 APP 的遠端直接拿來用；每個 APP 各自維護 Git 紀錄。
- 自有程式碼尚未選定授權，不得宣稱整個專案採 MIT。
- README_GITHUB_DRAFT.md、review_*、test-results 與離線 HTML 均由 .gitignore 排除。
- PDF_manager/tests/test_ui.cjs 可在完成離線建置且安裝 Playwright／Chrome 的環境中執行；不依賴原開發資料夾。

## 尚未完整驗證

DOCX 排版、PDF 印章、大型／加密文件、來源多選拖曳全部細節、多瀏覽器、全面無障礙及資安稽核。測試完成範圍請以 TEST_REPORT 為準。
