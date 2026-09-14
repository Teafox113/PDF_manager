# GitHub Release 附件

此資料夾保存可直接下載執行的離線 HTML。

目前附件：

```text
pdf_editor_offline_v2.2.0-F.html
```

離線 HTML 由 `build_offline.py` 產生，體積較大且包含第三方函式庫，因此由 `.gitignore` 排除，不納入 Git 歷史。建立 GitHub Release 時再手動附加。

可使用 `SHA256SUMS.txt` 驗證附件完整性。

2026-09-14：HTML 已補入第三方條文，可由 About →「第三方授權」開啟。應用版本保持 2.2.0-F，程式邏輯與函式庫未變；校驗碼已更新。

目前為授權補件候選，dingbat-to-unicode 1.0.1 原文仍待上游確認，詳見 ../docs/LICENSE_AUDIT.md；尚不可視為全部授權已結案。
