# 維護交接

## 2026-10-16 — v2.8.1-F 發布授權

- 使用者已完成測試並授權將本版更新到既有公開儲存庫；發布前再次檢查私人測試文件未納入。
- 公開版本以遠端 main、v2.8.1-F tag 與 Release 頁為準；以下「未發布」描述為開發階段歷史。
- 發布僅同步明確允許的來源檔案與兩個附件，不包含私人 PDF、診斷腳本或 test-results。

## 2026-10-16 — v2.8.1-F 超連結修正候選

- 取代下方 v2.8.0-F 的「所有註解均阻擋」限制，普通網址與明確內部跳頁連結可用。不是開放所有 PDF 動作／註解。
- `appendPageToPdfDocument` 在需清理時先暫移來源 Annots 再 copyPages，finally 還原來源記憶體節點；只重建驗證後的連結資料。不可直接複製 Link 的 Dest/P/A 參照，否則會把不在輸出頁樹的原始頁面帶回。
- `pdfLinkIdentity` 為不含原始 PDF 位元組的工作階段識別；圖片化替代頁保留此識別供跳頁重映射，目的頁座標改用 Fit。沒有目的頁的分頁 ZIP 會省略該跳頁連結。
- `pdfCleanReason`／`pdfCleanPage` 經 saveEditedPdf 保留，中英訊息在產生錯誤時格式化；單頁 ZIP 使用來源主 PDF 頁碼。
- 新 `tests/test_link_cleanup.cjs` 僅含合成文件。私人診斷腳本留在發布候選外，依環境變數讀取指定本機檔案；不儲存 PDF、擷取文字或截圖。
- 未 Push／發布；新離線成品不覆蓋 v2.8.0-F。舊版本紀錄如下。

## 2026-10-16 — v2.8.0-F 本機候選，尚未發布

- 頁面編輯來源在本發布候選資料夾；未同步 Git 發布儲存庫、未 Commit／Push。下列 v2.7.1-F 發布紀錄屬歷史。
- 新增 `page_editor.js`，由 `build_offline.py` 內嵌到單檔離線版。文字／表格以圖片物件表示，保留本次工作階段編輯資料；匯出後不可重新編輯儲存格。
- 新增 `pdf_resource_cleaner.js` 自製資源清理，不整合 MuPDF／EmbedPDF。`PAGE_ERASURE_ENABLED=true`，但預檢完整候選輸出成功才提交變更；PDF／ZIP 匯出必須經 `saveEditedPdf`，不得直接繞過清理。
- `test-results/page-edit-build-01/` 為舊不安全原型，僅留作本機評估重現；不得交付或發布。`page-edit-build-02/` 已停用消去，也只是未發布的功能測試檔，不是正式更新。
- 使用者拒絕整份 PDF 圖片化；應保留未編輯頁文字、避免共享資源誤刪或殘留。
- 實測 EmbedPDF PDFium 2.15.1 可保留文字，但直接刪除共用圖片會連帶改變其他頁圖片。
- MuPDF 1.28.1 僅做過本機評估，使用者要求低版權風險自行開發後已排除整合。未擅自改變本專案授權。
- 自製方案只將編輯頁圖片化；資源清理器是有限範圍的 PDF 語法解析與物件回收，不是通用原生文字刪除引擎。對其他頁仍在使用的原圖保守拒絕，不能宣稱可處理所有 PDF 或完整個資清理。
- 詳見 `docs/TEST_REPORT.md`、`docs/KNOWN_ISSUES.md`；原始開發目錄及既有成品不動，候選版需使用者測試後另行授權發布。

更新：2026-10-08。版本：v2.7.1-F。使用者已完成驗收並授權發布；遠端發布狀態以 main 與版本 Release 頁面為準。

- 修正旋轉目標 PDF 蓋章座標，新增 `tests/test_stamp_geometry.cjs`；測試不包含使用者 PDF。
- 舊離線成品保留；本次使用 v2.7.1-F 成品。原始開發檔及使用者 PDF 不變。

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
- 中英文 README 新增 Issues 聯繫說明。2026-09-21 首次 Push 成功（f31342d），本機 main 已追蹤 origin/main；GitHub 儲存庫公開且 Issues 啟用。
- v2.7.0-F 首次發布只有 Git 來源；v2.7.1-F 發布流程包含來源更新及 GitHub Release 的離線 HTML／SHA256SUMS.txt 附件。
- 不可將其他 APP 的遠端直接拿來用；每個 APP 各自維護 Git 紀錄。
- 自有程式碼尚未選定授權，不得宣稱整個專案採 MIT。
- README_GITHUB_DRAFT.md、review_*、test-results 與離線 HTML 均由 .gitignore 排除。
- PDF_manager/tests/test_ui.cjs 可在完成離線建置且安裝 Playwright／Chrome 的環境中執行；不依賴原開發資料夾。

## 尚未完整驗證

DOCX 排版、PDF 印章、大型／加密文件、來源多選拖曳全部細節、多瀏覽器、全面無障礙及資安稽核。測試完成範圍請以 TEST_REPORT 為準。
