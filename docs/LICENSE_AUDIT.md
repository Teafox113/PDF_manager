# 第三方授權查核紀錄

## 2026-09-21 更新 — v2.7.0-F

維護者 mwilliamson 於 2026-09-19 明確確認 1.0.2 新增的 LICENSE 適用所有先前版本，包含 1.0.1：
https://github.com/mwilliamson/dingbat-to-unicode/issues/1#issuecomment-5740760399

正式原文來源固定至 commit `a89b69198c2dd030b097cbf44b4eb7dd8b85722d` 的 `js/LICENSE`，Copyright (c) 2021, Michael Williamson，BSD-2-Clause。已新增獨立 LICENSE、更新 manifest 及完整條文。MAMMOTH-LICENSE-REFERENCE.txt 留作歷史依據，不再是該元件的現行授權文字。無需因此升級函式庫；其餘固定依賴及保守附錄範圍不變。

下方是原先查核的歷史紀錄；其中暫行登錄與尚待確認事項已被本節取代。

## 2026-09-14 歷史紀錄


日期：2026-09-14；應用版本：2.2.0-F。

## 結果與限制

已收集 44 組固定套件／版本的授權或上游狀態資料、36 個不同的來源署名／授權註解區塊。四個主要函式庫與 Worker 的程式碼均與官方同版本套件逐字核對（UTF-8、LF 正規化），不依今天重新解析 semver 來猜測版本。

**暫行決定（2026-09-14）：依專案所有者指示，dingbat-to-unicode@1.0.1 暫時引用 Mammoth 1.6.0 的 BSD-2-Clause 授權。** 兩者均署名 Michael Williamson、明確宣告 BSD-2-Clause；Mammoth 官方瀏覽器包亦逐項列出 dingbat-to-unicode 與其授權。

已保存 Mammoth 原文引用副本、官方 metadata 與登錄依據。此處不宣稱上游已確認同一份 copyright notice 的涵蓋範圍；Mammoth 的 2013 年署名未被重新歸屬給 dingbat-to-unicode。獨立套件缺少自身原文的事實保留為後續追蹤，不再列成必須先取得確認才能繼續本專案準備工作的阻擋項。本次未聯絡上游或變更 DOCX 功能。

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
- dingbat-to-unicode 的參考檔明確命名為 MAMMOTH-LICENSE-REFERENCE.txt，完整保留 Mammoth 原文並標示暫行引用，未冒充該獨立套件的已證實授權原文。
- 本專案自有程式碼未新增授權。

## 發布產物

licenses/manifest.json 記錄各原文與五份函式庫雜湊；THIRD_PARTY_NOTICES.txt 彙整已取得原文及未解決項目。

離線 HTML 的 About 可開啟「第三方授權」，不需要網路。只補入授權顯示，不升級第三方函式庫，也不修改原有 PDF 編輯邏輯。

本次驗證涵蓋授權檔完整性、五份函式庫身份、內嵌條文還原一致性、既有 script 區塊不變，以及 Release SHA-256；不代表已執行完整 PDF 操作與瀏覽器互動測試。
