# 維護交接

更新日期：2026-09-14
發布候選：`v2.2.0-F`

## 目前狀態

- 發布候選來源為原專案的 `branch_v2`。
- 主程式與 `version.json` 均為 `v2.2.0-F`。
- 最新離線成品已放在 `release-assets/`。
- 原始開發資料夾未被移動、重新命名、刪除或覆寫。
- 發布副本已複製至使用者指定的本機 GitHub 工作區。
- 該發布副本已初始化 Git，分支為 `main`，並完成第一筆本機提交。
- 尚未設定遠端、建立 GitHub 儲存庫或 Push。

## 本次發布整理

- 新增 README、AGENTS、HANDOFF、SECURITY 與發布檢查表。
- 新增 `.gitignore`、`.gitattributes`、`.editorconfig`。
- 將過時的文件標題與測試預期版號更新為 `v2.2.0-F`。
- 將離線建置輸出集中到 `release-assets/`。
- 建置腳本加入防覆寫機制；需明確使用 `--force` 才會覆寫同名成品。
- Git 只追蹤來源、說明與校驗檔；離線 HTML 作為 Release 附件。

## 尚待完成

2026-09-14 補件：新增 licenses/、THIRD_PARTY_NOTICES.txt、授權查核紀錄與建置雜湊檢查。離線成品已內嵌已取得原文並更新 SHA-256，原有 script 區塊完全相同。四項授權／包裝測試通過，未執行完整 UI 測試。dingbat-to-unicode 1.0.1 的上游 LICENSE／copyright 原文仍缺，公開散布前需確認。

1. 依 `docs/TEST_REPORT.md` 執行功能測試並填寫實際結果。
2. 確認專案本身的授權方式；公開前視需要加入 `LICENSE`。
3. 公開前確認 Git 提交作者 Email 是否改用 GitHub noreply 地址。
4. 在 GitHub Desktop 加入本機儲存庫後，使用「Publish repository」建立遠端。
5. 建議首次發布保持 Private；未經明確同意不得建立公開儲存庫。

## 已知限制

詳見 `docs/KNOWN_ISSUES.md`。目前特別注意加密 PDF、旋轉頁點陣化及大型文件的記憶體用量。
