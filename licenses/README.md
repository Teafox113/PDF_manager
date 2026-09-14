# 上游授權原文

各套件目錄保留對應固定版本套件中的完整授權；manifest.json 記錄來源、版本、授權、檔案 SHA-256 及函式庫 SHA-256。

- 來源為 npm 官方登錄的固定版本 tarball，取得時核對登錄中的 tarball shasum。
- isarray 的完整 MIT 原文取自其同版本 README 的 License 區段。
- set-immediate-shim 的原文取自上游 v1.0.1 標籤。
- JSZip 選用 MIT，LICENSE-MIT.txt 為上游雙重授權文件中的 MIT 區段。
- UPSTREAM-SOURCE-NOTICES.txt 保存官方非壓縮版本及 source map 中的著作權與授權註解。
- dingbat-to-unicode 依所有者於 2026-09-14 的指示，暫時引用 Mammoth 的 BSD-2-Clause 原文；MAMMOTH-LICENSE-REFERENCE.txt 與 Mammoth LICENSE 位元組一致。UPSTREAM-STATUS.txt 說明暫行依據及尚未取得上游涵蓋範圍確認的事實，upstream-package.json 保存獨立套件的宣告。未擬造新的著作權聲明。

部分依賴的版本由上游鎖定檔取證；對無法從壓縮成品逐模組證實的相鄰版本，採保守方式一併附錄，勿將本表當成執行時 SBOM。

完整說明：../docs/LICENSE_AUDIT.md。這些文件中的第三方作者姓名、Email 是上游著作權署名，應保留，不是本專案私密憑證。
