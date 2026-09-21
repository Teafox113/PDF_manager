# PDF Manager

[English](README.en.md) · 繁體中文

本專案提供瀏覽器基底之以頁面為基礎用來整理、合併 PDF 的工具，不必把文件交給線上轉檔服務。

目前版本：**v2.7.0-F**。介面支援 **繁體中文 / English**，並提供四套可切換佈景。

## 能做什麼？

- **整理頁面**：刪除、拖曳排序、整組移動、旋轉，以及最多 30 步復原。
- **插入內容**：從其他 PDF、圖片或 DOCX 加入頁面；支援來源多選及整組拖入。
- **合併頁面**：把多個來源頁垂直拼貼為單頁。
- **加入印章**：載入圖片或 PDF 印章，移動、縮放、翻轉與矩形裁切。
- **輸出檔案**：另存整份 PDF，或逐頁輸出 PDF 並打包 ZIP。
- **調整工作介面**：中英文即時切換、三段縮圖尺寸、可拖曳面板寬度，以及四套佈景。

本工具是頁面整理器，尚不含 PDF 文字編輯器、OCR 工具或數位簽章服務。圖片蓋章功能僅為覆蓋圖片，不等於具驗證能力的數位簽章。

## 快速開始

1. 下載或複製專案，用桌面版 Chrome 或 Edge 開啟 [pdf_editor.html](pdf_editor.html)。
2. 在工具列選擇 **Language / 語言** 與 **佈景 / Theme**。
3. 按「開啟主 PDF」，需要插入內容時在右側開啟來源檔案。
4. 整理完成後按「另存新檔」下載結果。修改不會直接覆寫原文件。

來源版每次啟動都可能需要網路載入固定版本的 CDN 函式庫；不保證開啟過一次就能永久離線。文件編輯狀態不會自動儲存，關閉或重新整理前請先下載結果。

## 語言與佈景

語言切換會更新工具列、選單、提示、狀態、確認視窗及蓋章介面；不翻譯文件內容或使用者檔名，也不重設頁面與復原紀錄。預設為繁體中文。

| 佈景 | 配色與風格 |
| --- | --- |
| 鈦金深色 / Titanium | 暖黑底、香檳金重點（預設） |
| 紙感淺色 / Paper | 白色工作區、霧灰底、墨藍重點 |
| 深海藍 / Ocean | 深藍工作區、冰藍重點 |
| 森林綠 / Forest | 深綠工作區、鼠尾草綠重點 |

瀏覽器允許時會記住語言、佈景與面板寬度；停用儲存功能時仍可使用，只是不保留偏好。主題不改變 PDF、印章或輸出檔案的顏色。

## 建立離線版

需求：**Python 3.10 或更新版本**，以及建置時的網路連線。不需要 npm 安裝步驟。

在專案根目錄執行：

```sh
python build_offline.py
```

產出：

```text
release-assets/pdf_editor_offline_v2.7.0-F.html
```

直接用瀏覽器開啟此檔即可使用離線版。建置會核對函式庫及授權檔雜湊、內嵌依賴及完整第三方條文；同名成品存在時停止，不自動覆寫。離線 HTML 不納入 Git 歷史；若日後另行發布 GitHub Release，才提供成品下載。

## 隱私與資料

- 應用程式在瀏覽器本機解析、編排與輸出文件，沒有設計文件上傳 API。
- 來源版會向 cdnjs 請求 JavaScript，這不等同文件上傳，但來源版不是完全離線執行。
- 離線成品內嵌函式庫，使用內容安全政策限制外部連線。
- `localStorage` 只保存介面偏好，不保存文件內容。
- 處理機密資料時，應使用經驗證的離線成品並遵循所在組織的資料規範。功能測試不等於全面資安稽核。

## 限制

- 舊式 `.doc` 不支援；DOCX 轉換不保證保留 Word 原始排版。DOCX 不支援與 PDF／圖片混合批次載入，多個 DOCX 同時選取時只處理第一個。
- 密碼保護、特殊加密或結構異常 PDF 不保證可讀取。
- 旋轉 PDF 頁面會轉成約 1200px 寬點陣圖，可能失去文字選取能力及增加檔案大小。
- 大型文件、圖片與復原快照可能占用大量記憶體。
- 主要以桌面瀏覽器操作為目標；Firefox、Safari 與手機介面尚未完整驗證。
- 第三方函式庫沿用固定版本，本次未進行全面依賴漏洞稽核；請勿把未知來源檔案視為可信。

## 專案結構

```text
pdf_editor.html           中英文主程式（含四套佈景）
version.json              發布版本設定
build_offline.py          離線建置腳本
license_bundle.py         第三方授權與雜湊校驗
README.en.md              English documentation
licenses/                 上游授權及來源紀錄
THIRD_PARTY_NOTICES.txt    第三方完整條文
docs/                     測試、限制與開發文件
tests/                    授權及瀏覽器測試
release-assets/           本機離線成品（HTML 不納入 Git）
```

## 依賴與授權

| 函式庫 | 版本 | 宣告授權 |
| --- | --- | --- |
| PDF.js | 3.11.174 | Apache-2.0 |
| pdf-lib | 1.17.1 | MIT |
| html2canvas | 1.4.1 | MIT |
| Mammoth | 1.6.0 | BSD-2-Clause |

第三方元件及其附屬依賴仍受各自條款約束；摘要不能代替 [完整授權](THIRD_PARTY_NOTICES.txt)。來源與校驗資訊見 [licenses](licenses/README.md)。

`dingbat-to-unicode 1.0.1` 已附上自身的 BSD-2-Clause 原文（Copyright 2021, Michael Williamson），依據[維護者確認舊版本同樣適用的回覆](https://github.com/mwilliamson/dingbat-to-unicode/issues/1#issuecomment-5740760399)，不再依賴暫行引用 Mammoth 的聲明。

本專案自有程式碼**尚未選定開源授權**；第三方授權不會自動套用於整個 PDF Manager。詳見 [本專案授權狀態](PROJECT_LICENSE_STATUS.md)。

## 測試與問題回報

```sh
python -m unittest discover -s tests -v
```

開發用瀏覽器測試另需 Node.js、Playwright 與 Chrome，且先完成離線建置：

```sh
npm install --no-save --package-lock=false playwright
node tests/test_ui.cjs
```

Node.js / Playwright 僅用於測試，不是使用或打包工具的必要依賴。詳見 [實測報告](docs/TEST_REPORT.md) 與 [已知限制](docs/KNOWN_ISSUES.md)。

回報問題時請提供版本、瀏覽器、操作步驟及去識別化截圖；勿公開上傳個資、內部 PDF、印章原檔或憑證。
