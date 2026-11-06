# 離線成品

## v2.14.0-F

下載 pdf_editor_offline_v2.14.0-F.html；主引擎 PDF.js 6.5.438，含真實離線 Worker、CMap、字型及 WASM 資源。SHA256SUMS.txt 為成品校驗碼。HTML 不提交 Git，僅作 GitHub Release 附件；不包含私人 PDF、ZIP 或測試截圖。

以下為歷史紀錄；舊版本狀態不代表目前版本。


最新本機安全修補版：`pdf_editor_offline_v2.13.2-F.html`，固定 PDF.js 非 eval 載入、移除離線 unsafe-eval，包含旋轉尺寸修正。未發布 GitHub。舊成品只保留作歷史，不包含此修補；依賴仍為 3.11.174，並非全面升級。

本機測試版：`pdf_editor_offline_v2.13.1-F.html`，修正旋轉後紙張尺寸放大；未發布 GitHub。請重新載入原始 PDF 測試，舊版已放大的輸出不自動修復。下方為公開版本資訊。

現行版本：`pdf_editor_offline_v2.13.0-F.html`，包含 A4／B4／自訂裁切及參考頁等比例校正，新增結果預覽、移動框、鍵盤微調及錯誤／進度打磨。裁切頁重建圖片，校正保留原 PDF 文字／向量。所有舊成品保留。

版本下載頁：[v2.13.0-F](https://github.com/Teafox113/PDF_manager/releases/tag/v2.13.0-F)。下載 HTML 後用桌面版 Chrome／Edge 開啟，不需安裝。

v2.12 的裁切／校正整合於本版；v2.9／v2.10 的頁內文字與操作改善已整合於 v2.11。這些審閱候選不獨立發布。

`pdf_editor_offline_v2.8.1-F.html` 新增頁面編輯，修正普通超連結阻擋其他頁消去及診斷訊息。舊成品保留，不覆蓋。

包含中英文介面、四套佈景、既有 v2.6.2-F 功能與完整第三方授權。由 About →「第三方授權 / Third-party licenses」閱讀原文；dingbat 已使用作者確認適用 1.0.1 的正式授權。

使用 `SHA256SUMS.txt` 驗證成品。舊 v2.2.0-F 仍保留，僅作歷史參考。

HTML 由 .gitignore 排除，不納入 Git 歷史；來源 Push 不會自動建立 GitHub Release，也不會上傳本目錄的 HTML 附件。
