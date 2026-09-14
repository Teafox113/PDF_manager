# 第三方授權查核紀錄

日期：2026-09-14；應用版本：2.2.0-F。

## 結果與限制

已收集 44 組固定套件／版本的授權或上游狀態資料、36 個不同的來源署名／授權註解區塊。四個主要函式庫與 Worker 的程式碼均與官方同版本套件逐字核對（UTF-8、LF 正規化），不依今天重新解析 semver 來猜測版本。

**一項未解決：dingbat-to-unicode@1.0.1 的原始 LICENSE 與 copyright notice 缺漏。** 官方 npm metadata 明確標示 BSD-2-Clause，但發布 tarball、README 及查閱的上游 js/ 目錄沒有完整原文。已保存 metadata，未自行擬造。公開散布前需取得上游確認；本次沒有聯絡上游或變更 DOCX 功能。

## 取證方式

1. 從 npm 官方登錄下載固定版本 tarball，核對登錄的 shasum。
2. 對照既有 Release HTML 四個內嵌函式庫與 PDF.js Worker。
3. Mammoth 1.6.0：依官方 mammoth.browser.js 檔頭所列 17 組元件，以及內嵌 JSZip 的生產依賴查核。
4. pdf-lib 1.17.1：依 source map 及上游 v1.17.1/yarn.lock，收錄 standard-fonts、upng、pako、tslib。
5. html2canvas 1.4.1：依 source map 及上游 v1.4.1/package-lock.json，收錄 css-line-break、text-segmentation、utrie、base64-arraybuffer、tslib。
6. 保存壓縮時可能被省略的完整來源授權註解，包括 zlib 衍生程式碼、Mozilla、Microsoft、Glyph & Cog、Opera、PDFKit 來源聲明。

上游鎖定檔包含重複版本且 source map 有路徑重寫；為避免少附授權，一併收錄相關版本。44 組清單是保守授權附錄，不是每個執行中元件的精確 SBOM。PDF.js 的外部 CMap、Foxit／Liberation 字型檔與 Node canvas 並未包含在本次五份瀏覽器程式檔中，因此沒有將整個 npm 安裝依賴誤當成全部內嵌套件。

## 特別處理

- JSZip 官方雙重授權選擇 MIT，保留完整 MIT 原文。
- isarray 原文來自同版本 README；set-immediate-shim 原文來自上游 v1.0.1。
- dingbat-to-unicode 只保存官方宣告與缺漏狀態，未複製其他套件作者的 BSD 聲明冒充。
- 本專案自有程式碼未新增授權。

## 發布產物

licenses/manifest.json 記錄各原文與五份函式庫雜湊；THIRD_PARTY_NOTICES.txt 彙整已取得原文及未解決項目。

離線 HTML 的 About 可開啟「第三方授權」，不需要網路。只補入授權顯示，不升級第三方函式庫，也不修改原有 PDF 編輯邏輯。

本次驗證涵蓋授權檔完整性、五份函式庫身份、內嵌條文還原一致性、既有 script 區塊不變，以及 Release SHA-256；不代表已執行完整 PDF 操作與瀏覽器互動測試。
