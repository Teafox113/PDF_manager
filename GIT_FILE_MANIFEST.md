# Git 預計納入清單

本清單適用於 `PDF_manager` 發布候選及其 `main` 分支初始提交。

## 預計納入

```text
.editorconfig
.gitattributes
.gitignore
AGENTS.md
build_offline.py
CHANGELOG.md
GIT_FILE_MANIFEST.md
HANDOFF.md
pdf_editor.html
PUBLISH_CHECKLIST.md
README.md
SECURITY.md
THIRD_PARTY_LICENSES_SUMMARY.md
THIRD_PARTY_NOTICES.txt
PROJECT_LICENSE_STATUS.md
license_bundle.py
version.json

docs/BRANCH_EVALUATION.md
docs/CHANGELOG_v1.1.md
docs/CHANGELOG_v1.4.md
docs/CHANGELOG_v1.5.md
docs/CHANGELOG_v2.0.md
docs/CHANGELOG_v2.1.md
docs/CHANGELOG_v2.2.md
docs/DEV_LOG.md
docs/FUNCTION_MAP.md
docs/KNOWN_ISSUES.md
docs/LICENSE_AUDIT.md
docs/PROJECT_INDEX.md
docs/README.md
docs/TASK_CHECKLIST.md
docs/TEST_REPORT.md
docs/VERSION_WORKFLOW.md

release-assets/README.md
release-assets/SHA256SUMS.txt
tests/test_license_bundle.py
licenses/README.md
licenses/manifest.json
licenses/UPSTREAM-SOURCE-NOTICES.txt
licenses/<套件與版本>/<上游授權原文或缺漏紀錄>
```

## 保留在本機但由 `.gitignore` 排除

```text
release-assets/pdf_editor_offline_v2.2.0-F.html
```

該 HTML 應於建立 GitHub Release 時作為附件上傳，不放入 Git 歷史。

2026-09-14 新增 licenses/ 下全部授權資料。具體檔案與雜湊以 licenses/manifest.json 為準。離線 HTML 已內嵌條文，但 dingbat-to-unicode 上游原文缺漏仍待確認；目前不是公開散布授權結案狀態。

## 尚未加入

```text
LICENSE
```

專案所有者需在公開發布前決定專案授權方式；私有儲存庫可暫不加入。
