# 第三方開源授權聲明
Third-Party Open Source License Summary

本工具的離線發布檔（目前為 `pdf_editor_offline_v2.2.0-F.html`）以離線內嵌方式包含以下第三方開源 JavaScript 函式庫。
相關著作權與授權條款歸原作者所有。本工具未修改原始碼。

---

## 1. PDF.js

| 項目 | 內容 |
|------|------|
| 版本 | 3.11.174 |
| 著作權 | Copyright (c) Mozilla Foundation and individual contributors |
| 授權 | Apache License 2.0 |
| SPDX | `Apache-2.0` |
| 用途 | PDF 解析、頁面渲染、縮圖產生 |
| 來源 | https://github.com/mozilla/pdf.js |

Apache License 2.0 主要條款摘要：
- 可自由使用、複製、修改、散布
- 散布時須保留原始著作權聲明與授權條款
- 修改版本須標示修改說明

---

## 2. pdf-lib

| 項目 | 內容 |
|------|------|
| 版本 | 1.17.1 |
| 著作權 | Copyright (c) Andrew Dillon and pdf-lib contributors |
| 授權 | MIT License |
| SPDX | `MIT` |
| 用途 | PDF 建立、頁面複製、輸出編輯後的 PDF |
| 來源 | https://github.com/Hopding/pdf-lib |

MIT License 主要條款摘要：
- 可自由使用、複製、修改、散布、販售
- 散布時須保留原始著作權聲明與授權條款

---

## 3. Mammoth.js

| 項目 | 內容 |
|------|------|
| 版本 | 1.6.0 |
| 著作權 | Copyright (c) Michael Williamson and contributors |
| 授權 | BSD 2-Clause "Simplified" License |
| SPDX | `BSD-2-Clause` |
| 用途 | DOCX 轉 HTML，供頁面預覽截圖使用 |
| 來源 | https://github.com/mwilliamson/mammoth.js |

BSD 2-Clause 主要條款摘要：
- 可自由使用、複製、修改、散布
- 散布原始碼時須保留著作權聲明與授權條款
- 散布二進位形式時須在文件或其他提供材料中保留著作權聲明

**附屬依賴注意事項：**
Mammoth.js browser bundle 可能包含以下依賴：
- JSZip（MIT License）— ZIP 檔案處理（DOCX 格式為 ZIP）
- bluebird 或 Promise polyfill（MIT）
如需完整依賴授權清單，請參閱 Mammoth.js 原始碼庫 `package.json` 及 `node_modules`。

---

## 4. html2canvas

| 項目 | 內容 |
|------|------|
| 版本 | 1.4.1 |
| 著作權 | Copyright (c) Niklas von Hertzen and html2canvas contributors |
| 授權 | MIT License |
| SPDX | `MIT` |
| 用途 | DOCX 預覽頁面的 HTML 截圖（轉為 Canvas 圖片） |
| 來源 | https://github.com/niklasvh/html2canvas |

---

## 內網散布建議

若本工具要於公司內網長期維護與散布：

1. **保留本文件**或將授權聲明附於工具說明文件中。
2. **備份原始授權文本**：各函式庫的完整 LICENSE 文件可從上方來源連結取得。
3. **雜湊值備查**：建議記錄 HTML 檔案的 SHA-256 雜湊值，供資安單位核查。
4. **版本追蹤**：如升級函式庫版本，請重新確認各授權條款是否變更。

---

*本摘要文件由 FloofyFox 維護，最後更新：2026-06-08*
