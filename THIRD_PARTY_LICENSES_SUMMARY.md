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

## dingbat-to-unicode 的暫行授權登錄

**2026-09-14 依專案所有者指示，暫時引用 Mammoth 1.6.0 的 BSD-2-Clause 授權登錄 dingbat-to-unicode 1.0.1。** 依據是兩者皆署名 Michael Williamson、宣告 BSD-2-Clause，且 Mammoth 官方瀏覽器包明列此元件及授權。引用原文保存在 licenses/dingbat-to-unicode-1.0.1/MAMMOTH-LICENSE-REFERENCE.txt。

這是本專案的暫行登錄方式，不是上游已確認授權涵蓋範圍。Mammoth 原文的 2013 年署名仍歸屬 Mammoth，不改寫成已證實的 dingbat-to-unicode 年份；該套件自身原文缺漏的事實仍保留。日後取得上游補充時再更新。

## 散布方式

- 原始碼：一併保留 licenses/、THIRD_PARTY_NOTICES.txt 與本文件。
- 離線版：完整已取得條文內嵌於 HTML，可由 About 的「第三方授權」開啟。
- 既有本機 Release HTML 已補入條文並更新校驗碼；上層 branch_v2 原檔保持原樣。
- build_offline.py 現在驗證函式庫雜湊與授權檔，並內嵌完整條文；變更版本後需重新查核。
- 本專案自己的授權仍待所有者決定，見 PROJECT_LICENSE_STATUS.md。第三方授權不代表授予整個應用程式開源權利。
