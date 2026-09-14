# GitHub 發布檢查表

## 檔案與版本

- [x] 發布候選放在獨立 `PDF_manager` 資料夾
- [x] 原始專案未搬移、刪除、重新命名或覆寫
- [x] `pdf_editor.html` 與 `version.json` 版號皆為 `v2.2.0-F`
- [x] README、AGENTS、HANDOFF、SECURITY 已建立
- [x] `.gitignore`、`.gitattributes`、`.editorconfig` 已建立
- [x] Git 預計納入清單已建立
- [x] 離線成品與 SHA-256 校驗資訊已準備
- [ ] 決定專案授權方式並視需要加入 `LICENSE`

## 第三方授權（2026-09-14）

- [x] 收集主要與附屬元件的上游原文及來源，見 licenses/manifest.json
- [x] 已驗證五份函式庫與目前離線成品一致
- [x] JSZip 明確選用 MIT，保留其他上游署名與 zlib 聲明
- [x] 已將取得的完整條文內嵌離線 HTML，並更新 SHA-256
- [x] 授權檔、雜湊拒絕、條文內嵌與 Release 校驗測試通過
- [ ] 取得 dingbat-to-unicode 1.0.1 缺漏的 LICENSE／copyright 原文或上游確認
- [ ] 所有者確認自有程式碼權利及授權方式

## 安全與隱私檢查

- [x] 未發現 `.env`、API Key、Token、密碼或私鑰
- [x] 未發現硬編碼本機絕對路徑
- [x] 未包含使用者 PDF、圖片或 DOCX
- [ ] 確認公開顯示 `github.com/Teafox113` 與 `FloofyFox` 品牌名稱
- [ ] 公開前再執行一次機密掃描

## 測試

- [x] Python 與 JSON 靜態語法檢查
- [ ] 開發版主要功能測試
- [ ] 離線版斷網測試
- [ ] PDF 開啟、刪除、插入、排序、Undo、另存測試
- [ ] 圖片及 DOCX 插入測試
- [ ] 個別分頁 ZIP 與中文檔名測試
- [ ] 將結果記錄至 `docs/TEST_REPORT.md`

## Git 與 GitHub

- [x] 已確認使用者指定的本機 GitHub 工作區存在
- [x] 已複製至該工作區的 `PDF_manager` 子資料夾
- [x] 已初始化 Git，預設分支為 `main`
- [x] 已檢查 Git 預計納入清單
- [x] 已建立初始本機提交
- [ ] 公開前確認提交作者 Email 是否需改用 GitHub noreply
- [ ] 建立遠端儲存庫；預設先使用 Private
- [ ] Push 前再次取得使用者確認
- [ ] 將 `release-assets/pdf_editor_offline_v2.2.0-F.html` 上傳為 GitHub Release 附件
