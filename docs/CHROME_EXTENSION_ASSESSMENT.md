# Chrome 擴充功能開發評估與交接

日期：2026-11-05；基線：v2.14.0-F。僅評估，未建立擴充功能、工作區、對話或商店項目。

## 結論

差異屬中等程度的架構與打包調整，不需要重寫 PDF 編輯核心。建議另開對話，使用同一儲存庫的隔離工作目錄／開發分支，以免 MV3 改造干擾現有單檔版；不建議建立永久獨立的第二套核心或另一個 GitHub 儲存庫。新對話本身不會自動隔離檔案。

本輪依使用者授權完成 PDF.js 6.5.438 與旋轉修正後發布共同基線。另開工作區時以 v2.14.0-F 的 Git commit／tag 為準，不複製私人測試檔或整個本機資料夾。

## 共用與不同部分

| 項目 | 可以共用 | Chrome 版要調整 |
| --- | --- | --- |
| PDF 頁面操作、編輯、資源清理、幾何 | 保留既有邏輯及合成回歸 | 抽出全域耦合，不另寫第二套核心 |
| 介面、中英文、主題 | 保留主要 UI | 目前約 51 行內嵌事件屬性改事件綁定；拆分 inline scripts |
| 啟動 | 同一編輯器 | MV3 manifest、圖示、擴充功能按鈕開啟專用分頁；不要把長文件編輯放在會關閉的 popup |
| 引擎與 Worker | 同一安全載入介面 | 已升級 PDF.js 6.5.438；改為 MV3 套件內資源、Worker／Wasm／字型等可解析路徑；不載入遠端可執行程式碼 |
| 輸出 | PDF／ZIP 產生邏輯 | 驗證 Blob 下載、URL 壽命及所需最小權限；不要預先要求 downloads 或全網站權限 |
| 剪貼簿／DOCX | 現有功能與範圍限制 | 驗證 extension origin、使用者手勢、iframe／html2canvas 與嚴格 CSP；失敗不放寬到 unsafe-eval |
| 發布 | 版本、授權、測試規則 | 商店 ZIP、隱私政策、權限理由、截圖、聯繫方式及獨立發布流程 |

建議未來同一份來源產生兩個目標：既有離線 HTML，以及 MV3 擴充功能套件。共同安全修補只維護一次。

## 建議階段

1. 先確認安全修補版；為現有本機改動建立經審查的共同基線，保留原資料夾與舊成品。
2. 在隔離工作目錄做最小 MV3 驗證：開啟專用分頁、選本機檔案、預覽、旋轉、匯出，不接贊助／登入。
3. 保留已升級的 PDF.js 6.5.438，將離線 Blob 橋接改為套件內 ESM／Worker 資源，核對授權；同時跑離線 HTML 與擴充功能回歸。不得只測空白頁或拉寬 CSP。
4. 導入其餘頁面編輯、剪貼簿及 DOCX，依功能檢查最小權限與資料流；優先不要求全網站存取，不接管系統預設 PDF 閱讀器。
5. 完成安全／隱私／可用性驗收後，再另行取得上架與贊助連結設定的授權。

驗收至少包含：雙語／主題、實際 PDF／ZIP 下載、尺寸與旋轉、消去資源清理、來源失敗保護、剪貼簿、DOCX、重開與未儲存提醒、零非預期外連、全部權限理由及授權檔。離線版測試通過不等於擴充功能通過。

## 官方依據

- [MV3 安全遷移](https://developer.chrome.com/docs/extensions/develop/migrate/improve-security)：套件內程式碼、移除任意字串執行、資源分發。
- [擴充功能 CSP](https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy)：extension pages 不允許現有 inline JavaScript／unsafe-eval 模式。
- [商店政策](https://developer.chrome.com/docs/webstore/program-policies/policies)：最小權限、隱私政策與準確功能聲明。

以上不保證商店審核通過，不代表已解決 Edge PDF 閱讀器快捷鍵問題；亦未授權另建專案或對話。
