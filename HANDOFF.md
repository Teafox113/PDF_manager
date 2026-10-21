# 維護交接

## 2026-10-21 — v2.13.0-F 發布授權

- 使用者要求完成版本更新日誌並推送既有 GitHub 專案；發布內容合併 v2.12 裁切／尺寸校正及 v2.13 操作打磨。
- 中英文 README 與正式 CHANGELOG 對應 v2.13.0-F。下方及 version.json 的候選描述保留建置時開發歷史；發布狀態以遠端 main、tag 與 Release 為準。
- 不重建已測試成品、不覆蓋舊版或上層原始專案。同步只用明確檔案清單，Release 僅有離線 HTML 與校驗碼。
- 私人 PDF 僅於本機記憶體比對發布內容，不保存擷取物、不進 Git／Release；Git 作者繼續使用 noreply，聯繫請至 Issues。

## 2026-10-21 — v2.13.0-F 本機操作打磨

- 僅修改本機發布來源，未同步 F 槽或推送；保留 v2.12 及所有舊成品。
- page_geometry 新增結果預覽、移動／重畫、鍵盤 mm 位移、重設與 pointer 取消還原。拖曳結束才清除快照，lostpointercapture 在正常 pointerup 後不還原。
- 欄位診斷共用 geometryCropIssue；reset 不改文件 history。結果預覽禁止 pointer 拖曳但仍可用數值／鍵盤定位。
- progress callback 是選填，既有消去與直接 fit 呼叫可不傳；UI 成功／失敗皆隱藏 progress。沒有新增背景保存或雲端傳送。
- tests/test_geometry_polish.cjs 僅合成文件，核對構圖像素、pointer rollback、欄位、進度與失敗／過期渲染防護；不是完整商用品質或資安認證。

## 2026-10-21 — v2.12.0-F 頁面裁切／尺寸校正開發

- 使用者要求 A4／B4／自訂裁切與依文件另一頁尺寸等比例校正；只做本機審閱版，未取得本版 GitHub 發布要求。
- 新模組 page_geometry.js 內嵌於離線建置；數值 mm／資料 pt；preview pointer 由實際 DOM rect 換算，不依固定 UI zoom。
- 裁切復用 erasePageArea keepInside 分支及原圖指紋清理；不要改成只調 CropBox 後宣稱刪除。驗證全份候選後才 snapshot／commit。
- 校正將來源 visible 座標反轉為 Form matrix，drawPage 同 xScale/yScale 並置中；保留文字與向量，不複製來源註解。requiresLinkRebuild 確保其他頁內部連結不引入已替換舊頁；geometryChanged 目標用 Fit。
- 參考頁原始 bytes／頁索引不動；新物件定稿，Undo 保留原本工作階段物件。全部測試使用合成檔，不讀私人 PDF、不新增第三方套件。

## 2026-10-19 — v2.11.0-F 發布授權

- 使用者要求「更新 git」，授權更新既有 Teafox113/PDF_manager 與版本 Release。
- v2.9／v2.10 為未獨立發布的審閱版，功能整合於 v2.11.0-F。下方「本機候選／未發布」為開發歷史；實際狀態以遠端 main、tag 及 Release 為準。
- 只同步明確來源清單及兩個附件，保留原始專案與所有舊成品。私人文件僅供本機記憶體隱私比對，不保存擷取物或上傳。

## 2026-10-19 — v2.11.0-F 載入與匯出防護候選

- 仍僅本機來源與新成品，未同步 Git 工作區或發布。原始目錄及舊成品不動，未讀取私人 PDF。
- `loadSourceFiles` 持有 documentIO 鎖，傳入獨立 nextPages 給三個來源處理器；全部成功後才提交陣列、名稱、數量及選取。失敗保留舊來源，DOCX 臨時 iframe 在 finally 清除；不跳過失敗頁。PDF.js 來源文件解析後 destroy。
- `beginExport` 建立單次 task；`requestExportCancel` 僅設旗標；`exportCheckpoint` 讓出事件迴圈後檢查，不能宣稱能立即中斷第三方函式。PDF／ZIP 下載前最後檢查；取消不更新 exportedRevision。仍必須通過 saveEditedPdf 清理。
- `setDocumentBusy(false)` 清除 task、隱藏取消按鈕、恢復焦點；Esc／Tab／Enter／Space 在 busy 時只處理取消控件。來源載入不提供取消。
- `tests/test_io_safety.cjs` 全合成：批次失敗保留、格式拒絕、DOCX 中途渲染失敗、互斥、合成長文件、PDF／ZIP 取消與再次匯出。DOCX 渲染失敗案例注入 converter/render 結果，不宣稱已驗證真實 DOCX 排版忠實度。

## 2026-10-19 — v2.10.0-F 可靠性與操作打磨候選

- 僅在本機發布來源副本開發；未同步 F 槽 Git 工作區，未 Commit／Push／公開發布。
- `historyRevisions` WeakMap 將快照陣列對應 revision，undo/redo 恢復該標記；`snapshotForUndo` 清空 redo。保留深拷貝 content.rows，PDF bytes 仍共用不可變來源。
- `hasUnexportedChanges` 合併文件 revision 與文字草稿檢查。下載成功呼叫只能表示已交給瀏覽器，不代表已寫入磁碟；不可將提示稱作自動儲存。
- `loadMainFile` 確認後先解析下一份 PDF，再整批替換；`documentIO` 管控載入／匯出互斥與 inert UI。PDF/ZIP 使用 clonePageForUndo 快照；仍必須通過 saveEditedPdf 清理。
- 主文件載入時重設 undo/redo/revision；匯出失敗不更新 exportedRevision。真實下載測試與記憶體攔截測試分開。
- `renderStampEditor` 暫存 canvas 完成後才提交，sequence 排除過期渲染。ResizeObserver 只處理寬度變更，renderWorkWidth 避免重複重繪。
- 新 `tests/test_workflow_polish.cjs` 全合成，涵蓋換檔取消／失敗、互斥匯出、失敗解鎖、redo、消去後重做及窄視窗。

## 2026-10-19 — v2.9.0-F 頁內文字審閱候選

- 僅修改本機 E 槽發布來源副本，未同步 Git 發布工作區或 Push；不覆蓋 v2.8.1-F 離線版。
- `openContentEditor('text')` 轉接 `openInlineText`，將既有 textarea 與控制項移入頁面及上方工具列；表格維持原對話框，關閉時控制項回原容器。
- `readInlineText` 讀取限定字型及格式，`updateInlineText` 即時預覽；`pageTextFont` 與 `renderPageContent` 共用字型及行框基線。絕不插入使用者 HTML。
- `applyContentEditor` 為同步驗證／套用，回傳成功與否，讓切換工具及關閉編輯器先提交草稿；超頁失敗時仍保留草稿。
- mousedown.detail=2 處理重繪會移除目標節點的雙擊；輸入法 isComposing／229 不執行快捷鍵。格式為整框，非富文字片段模型。
- 新測試 `tests/test_inline_text.cjs` 只含合成內容。沒有使用私人 PDF、下載字型、引入外部編輯器或改動既有第三方授權。

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
