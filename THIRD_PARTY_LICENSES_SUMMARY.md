# 第三方授權資料

更新：2026-09-14；適用 PDF Manager v2.2.0-F 的目前固定函式庫。

完整條文在 [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt)，各上游原文與 SHA-256 在 [licenses/](licenses/README.md)。本文件只是索引，不取代原始條文。

| 主要元件 | 版本 | 授權 |
|---|---|---|
| PDF.js（含 Worker） | 3.11.174 | Apache-2.0 |
| pdf-lib | 1.17.1 | MIT |
| html2canvas | 1.4.1 | MIT |
| Mammoth.js | 1.6.0 | BSD-2-Clause |

附屬元件已依官方瀏覽器打包清單、source map 與版本鎖定檔收集，包含 JSZip、Bluebird、pako、tslib、xmldom、buffer、Unicode 排版工具等；共 44 組套件／版本資料。部分版本採保守方式一併附錄，不代表每一版本都出現在執行路徑中。精確範圍見 [授權查核紀錄](docs/LICENSE_AUDIT.md)。

JSZip 3.7.1 為 MIT／GPL 雙重授權，本專案選用 MIT 選項，附檔保留該選項的完整授權及著作權。pako 等來源內的 zlib 聲明，以及 Microsoft、Mozilla、Glyph & Cog 等附加聲明，保留於 licenses/UPSTREAM-SOURCE-NOTICES.txt。

## 尚未結案的上游缺漏

**dingbat-to-unicode 1.0.1** 的官方 package.json 宣告 BSD-2-Clause，但其 npm 套件及已查閱的上游原始碼庫未提供 LICENSE／著作權聲明原文。已保存官方 metadata 與缺漏紀錄，沒有臆造年份、權利人或授權原文。對外散布前仍需向上游確認，或另行核准替代方案；不可將本次補件理解為全部權利已獲確認。

## 散布方式

- 原始碼：一併保留 licenses/、THIRD_PARTY_NOTICES.txt 與本文件。
- 離線版：完整已取得條文內嵌於 HTML，可由 About 的「第三方授權」開啟。
- 既有本機 Release HTML 已補入條文並更新校驗碼；上層 branch_v2 原檔保持原樣。
- build_offline.py 現在驗證函式庫雜湊與授權檔，並內嵌完整條文；變更版本後需重新查核。
- 本專案自己的授權仍待所有者決定，見 PROJECT_LICENSE_STATUS.md。第三方授權不代表授予整個應用程式開源權利。
