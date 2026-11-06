# 安全依賴處理紀錄

日期：2026-11-05；目前版本 v2.14.0-F。

## 真正引擎升級

PDF.js 主引擎與 Worker 已由 3.11.174 升級至 **6.5.438**，不是只設定 isEvalSupported=false。版本來源為 [Mozilla v6.5.438](https://github.com/mozilla/pdf.js/releases/tag/v6.5.438)。

- [CVE-2024-4367](https://github.com/mozilla/pdf.js/security/advisories/GHSA-wgrm-67xf-hhpq) 修復版為 4.2.67；不再出貨受影響的 3.x 引擎。
- [CVE-2026-16633](https://github.com/mozilla/pdf.js/security/advisories/GHSA-hq66-cqwq-w95j) 公告修復版為 6.2.108；本版高於該修復版，且不整合 viewer scripting manager／QuickJS。
- 這不是其他所有函式庫的全面漏洞升級，也不是獨立滲透測試或「任何惡意 PDF 皆安全」保證。pdf-lib、html2canvas、Mammoth 維持原先鎖定版本。

## 模組與離線資源

pdf_engine_bundle.py 驗證兩個公開 archive 的 SHA-256，並核對 licenses/pdfjs-resources.json 中每個打包資源雜湊。套件在記憶體讀取，不執行 npm 安裝腳本、不任意解壓路徑。

主引擎以原生 ESM Blob 載入。Chromium 在 file:// 下的 module-worker 載入會失敗；本專案只將 worker 最後的 export{WorkerMessageHandler} 移除、兩處 import.meta.url 改為 self.location.href，再放入 classic Blob Worker。解析與解碼實作不變，保留原始版權頭及修改說明。建置對這三處變更的數量採嚴格檢查，不能靜默適配未知上游。

Worker 以 ready 握手確認真正啟動，15 秒未就緒或啟動錯誤直接拒絕，不退回 fake worker／UI 執行緒。所有產品載入通過 loadLocalPdf，只接受本機 bytes；文件正常完成、解析失敗、預覽或旋轉結束均回收 loadingTask 與自有 Worker。

CMap、Foxit 字型、Liberation Sans 2.1.5、JBIG2／OpenJPEG／QCMS WASM 及 ICC profile 全部內嵌。Worker 的專用 fetch／同步 XHR 只讀已列入清單的記憶體資源，拒絕其他 URL，沒有網路 fallback。CPU canvas 維持既有渲染方式；停用新版可選 renderer-worker／WebGPU，不停用解析 Worker。

Liberation 2.1.5 為未修改的 OFL 1.1 字型，取代 pdfjs-dist 中舊 GPL 字型；不出貨舊 GPL 字型、QuickJS 或其資源。各原文及修改說明在 THIRD_PARTY_NOTICES.txt 與 licenses/pdfjs-6.5.438/。

## CSP 與腳本邊界

- connect-src 'none'：不開放 CDN、HTTP、data 或 Blob fetch；資源 adapter 直接回傳記憶體 bytes。
- script-src 保留既有 unsafe-inline／Blob，**不允許 unsafe-eval**。新增僅限 WebAssembly 的 wasm-unsafe-eval，供已鎖定解碼器／色彩模組使用，不開放 JavaScript eval／Function。
- loadLocalPdf 保留 isEvalSupported=false 作防禦設定，但 6.x 已不以此舊選項作為主要修補；升級版本、沒有 scripting manager、真實 DOM／Worker CSP 測試才是本輪證據。enableXfa=false 明確維持。
- 不傳入任意使用者 options、URL 或 PDF viewer enableScripting 參數來冒充核心保護。
- 需支援 WebAssembly 的新版 Chrome／Edge。封鎖 WASM 的企業政策不在支援範圍。

## 回歸與未涵蓋範圍

tests/test_pdf_engine.cjs 用合成 PDF 驗證引擎版本、真實 Worker、中文 CMap、未嵌入標準字型、JPEG 2000 像素、ICC 色彩、無作用 PDF OpenAction，及有效／無效輸入後的 Worker 回收。三個 WASM 模組可編譯；JBIG2 尚無全面掃描語料庫回歸。

tests/test_pdf_security.cjs 以真正 DOM click 測試主頁／Worker 的 Function 皆被 CSP 拒絕，避免 DevTools 評估可繞過 CSP 的假通過。其他回歸包含 UserUnit／旋轉、裁切／校正、蓋章、文字／表格、消去、連結、真實下載與 120 頁文件。詳細結果見 docs/TEST_REPORT.md。

舊 HTML／Release 保留不改寫，請更新後再處理不可信文件。DOCX、剪貼簿等所有輸入面的全面稽核，跨瀏覽器與超大掃描壓力測試仍未完成。離線版 unsafe-inline 不是 MV3 可直接沿用的政策；Chrome 版需獨立打包及安全驗收。

## 歷史

v2.13.2-F 曾以 isEvalSupported=false 及移除 unsafe-eval 緩解舊 3.11.174；當時未推送。v2.14.0-F 已取代此暫時方案，原有檔案保留作歷史。
