# PDF Manager

PDF Manager 是一個在瀏覽器本機執行的 PDF 頁面管理工具，可刪除、插入、排序、旋轉及輸出 PDF 頁面。最新版為 `v2.2.0-F`。

## 主要功能

- 載入主 PDF 並顯示頁面縮圖
- 刪除、選取、拖曳及批次調整頁面順序
- 從其他 PDF、圖片或 DOCX 插入內容
- 旋轉頁面、復原操作及另存新 PDF
- 將每一頁輸出成單頁 PDF 並打包為 ZIP
- 提供可在斷網環境使用的單檔離線版本

## 快速開始

### 開發版

使用 Chrome 或 Edge 直接開啟 `pdf_editor.html`。

開發版會由 CDN 載入 PDF.js、pdf-lib、html2canvas 與 Mammoth.js，因此首次開啟需要網路。

### 離線版

可直接開啟：

```text
release-assets/pdf_editor_offline_v2.2.0-F.html
```

若要重新建立離線版，需要 Python 3：

```text
python build_offline.py
```

建置腳本預設輸出至 `release-assets/`。若同名檔案已存在，腳本會停止以避免覆寫；確認需要重建時才使用：

```text
python build_offline.py --force
```

## 隱私

- PDF、圖片與 DOCX 內容在瀏覽器本機處理。
- 程式沒有上傳文件的 API、WebSocket 或背景傳送功能。
- 開發版會連線到 cdnjs 下載固定版本的函式庫，但不會將使用者文件傳送至 CDN。
- 離線版已內嵌所需函式庫，並設定禁止外部連線的內容安全政策。
- `localStorage` 只保存左右面板寬度，不保存文件內容。

## 專案結構

```text
PDF_manager/
├─ pdf_editor.html              開發版主程式
├─ build_offline.py             離線版打包腳本
├─ version.json                 版本唯一真實來源
├─ CHANGELOG.md                 發布摘要
├─ THIRD_PARTY_LICENSES_SUMMARY.md
├─ docs/                        開發、測試與歷史文件
└─ release-assets/              GitHub Release 附件
```

## 主要依賴

- PDF.js 3.11.174
- pdf-lib 1.17.1
- html2canvas 1.4.1
- Mammoth.js 1.6.0

依賴版本固定於 `pdf_editor.html` 與 `build_offline.py`。詳細授權資訊見 `THIRD_PARTY_LICENSES_SUMMARY.md`。

## 已知限制

- 密碼保護或特殊加密 PDF 不保證可讀取。
- 旋轉 PDF 頁面會轉為 1200px 點陣圖，文字將無法選取且輸出可能變大。
- 大型文件與 30 步復原快照可能增加瀏覽器記憶體用量。
- 舊式 `.doc` 不支援，僅支援 `.docx`。
- Firefox 尚未完整測試，Safari 尚未測試。

## 測試與發布

- 測試清單：`docs/TEST_REPORT.md`
- 已知問題：`docs/KNOWN_ISSUES.md`
- 發布檢查：`PUBLISH_CHECKLIST.md`
- Git 納入清單：`GIT_FILE_MANIFEST.md`
- 維護交接：`HANDOFF.md`

## 授權狀態

本專案目前尚未加入專案本身的授權檔。建立公開儲存庫前，應由專案所有者決定是否採用開源授權。第三方元件仍依各自授權條款使用。
