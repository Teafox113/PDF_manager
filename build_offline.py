"""
build_offline.py
────────────────────────────────────────────────────────
從 pdf_editor.html 打包成完全離線 + 資安強化版本。

輸出檔名由 version.json 自動決定，格式：
  pdf_editor_offline_v{version}.html

使用方式：
  python build_offline.py

注意：需要網路連線（僅此一次，用於下載函式庫）。
      之後輸出的 HTML 永久離線，不需網路。

版號升版規則（SemVer）：
  PATCH (x.x.+1)：臭蟲修正、文字修正、UI 微調
  MINOR (x.+1.0)：新功能加入、顯著改善（向下相容）
  MAJOR (+1.0.0)：介面大改版、架構重寫、破壞性變更
→ 修改前請先更新 version.json，再執行本腳本。
"""

import urllib.request
import os
import sys
import re
import json
import argparse
from license_bundle import load_manifest, verify_bundle, embed_notices

# ── 函式庫下載清單 ────────────────────────────────────────
LIBS = [
    {
        "tag":  '<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>',
        "url":  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
        "name": "PDF.js 3.11.174",
    },
    {
        "tag":  '<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>',
        "url":  "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js",
        "name": "pdf-lib 1.17.1",
    },
    {
        "tag":  '<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>',
        "url":  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
        "name": "html2canvas 1.4.1",
    },
    {
        "tag":  '<script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"></script>',
        "url":  "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js",
        "name": "Mammoth.js 1.6.0",
    },
]

WORKER_URL  = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
WORKER_NAME = "PDF.js Worker 3.11.174"

SRC_FILE = "pdf_editor.html"


def parse_args():
    parser = argparse.ArgumentParser(
        description="建立可離線執行的 PDF Manager 單檔版本。"
    )
    parser.add_argument(
        "--output-dir",
        default="release-assets",
        help="輸出資料夾；相對路徑以本腳本所在位置為基準。",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="允許覆寫已存在的同名輸出檔。",
    )
    return parser.parse_args()

# ── 讀取版號 ─────────────────────────────────────────────
def load_version(here: str) -> dict:
    vpath = os.path.join(here, "version.json")
    if not os.path.exists(vpath):
        print("❌ 找不到 version.json，請確認版號設定檔存在。")
        sys.exit(1)
    with open(vpath, "r", encoding="utf-8") as f:
        return json.load(f)

# ────────────────────────────────────────────────────────
def download(url: str, name: str) -> bytes:
    print(f"  下載 {name} ...", end=" ", flush=True)
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read()
    print(f"完成 ({len(data):,} bytes)")
    return data


def apply_security(html: str, ver: dict) -> str:
    """套用資安強化修改，版號資訊從 ver（version.json）讀取"""
    version    = ver["version"]               # e.g. "1.1.0"
    ver_label  = f"v{version}"               # e.g. "v1.1.0"
    rel_date   = ver.get("release_date", "")
    channel    = ver.get("channel", "")
    dist_name  = f"pdf_editor_offline_v{version}.html"

    # 從 history 建立 changelog 文字
    history_lines = []
    for h in ver.get("history", []):
        history_lines.append(f"v{h['version']} ({h['date']}): {h['summary']}")
    changelog_block = "\n".join(history_lines)

    changes = []

    # ── 1. 更新工具列按鈕版號 ───────────────────────────
    html = re.sub(
        r'(FloofyFox · PDF Editor )v[\d.]+',
        lambda m: m.group(1) + ver_label,
        html
    )
    changes.append(f"✅ 工具列按鈕版號 → {ver_label}")

    # ── 2. 更新 About 面板 about-version ────────────────
    html = re.sub(
        r'(<div class="about-version">PDF 頁面編輯器 )v[\d.]+(<\/div>)',
        lambda m: m.group(1) + ver_label + m.group(2),
        html
    )
    changes.append(f"✅ About 面板版號 → {ver_label}")

    # ── 3. 檔頭版本註解 + Change Log ────────────────────
    FILE_HEADER = f"""<!--
檔案名稱：{dist_name}
工具名稱：本地端 PDF 頁面編輯器
版本編號：{ver_label}{' ' + channel if channel else ''}
修改日期：{rel_date}
使用情境：公司內網／本地端離線文件頁面整理
維護備註：
1. 本工具為單檔 HTML 離線工具，所有函式庫已內嵌，無需網路連線。
2. 所有 PDF、圖片、DOCX 解析與輸出均在瀏覽器本機端執行，不上傳任何資料。
3. 禁止新增任何外部 API、雲端上傳、追蹤碼、遠端記錄或 CDN 載入。
4. 版號升版後請同步更新 version.json 並重新執行 build_offline.py。
-->
<!--
Change Log

{changelog_block}
-->
"""
    html = FILE_HEADER + html
    changes.append("✅ 檔頭版本註解 + Change Log")

    # ── 4. CSP meta tag ──────────────────────────────────
    CSP = ('<meta http-equiv="Content-Security-Policy"\n'
           '      content="default-src \'self\' data: blob: file:; '
           'script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' blob:; '
           'worker-src blob:; '
           'img-src \'self\' data: blob: file:; '
           'style-src \'self\' \'unsafe-inline\'; '
           'connect-src \'none\'; '
           'object-src \'none\'; '
           'base-uri \'none\'; '
           'form-action \'none\';">')
    html = html.replace(
        '<meta charset="UTF-8">',
        '<meta charset="UTF-8">\n' + CSP,
        1
    )
    changes.append("✅ Content-Security-Policy meta tag")

    # ── 5. 外部 <a> 加 rel=noopener noreferrer ───────────
    def fix_anchor(m):
        tag = m.group(0)
        if 'noopener' not in tag:
            tag = tag.rstrip('>') + ' rel="noopener noreferrer">'
        return tag
    html, n = re.subn(
        r'<a\s+[^>]*href=["\']https?://[^"\']+["\'][^>]*>',
        fix_anchor, html
    )
    changes.append(f"✅ rel=noopener noreferrer（{n} 處）")

    # ── 6. 修正錯誤訊息 ───────────────────────────────────
    html = html.replace(
        "alert('mammoth 函式庫未載入，請確認網路後重新整理。');",
        "alert('函式庫未載入，請確認本 HTML 檔案是否完整，或重新取得完整離線版檔案。');"
    )
    changes.append("✅ 修正 mammoth 未載入錯誤訊息")

    # ── 7. 替換 fetch(data:image/...) → dataUrlToArrayBuffer ─
    HELPER = (
        "// ════════════════════════════════\n"
        "//  Data URL → ArrayBuffer（不使用 fetch，相容 CSP connect-src 'none'）\n"
        "// ════════════════════════════════\n"
        "function dataUrlToArrayBuffer(dataUrl) {\n"
        "  const base64 = dataUrl.split(',')[1];\n"
        "  const binary = atob(base64);\n"
        "  const bytes  = new Uint8Array(binary.length);\n"
        "  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);\n"
        "  return bytes.buffer;\n"
        "}\n\n"
        "// ════════════════════════════════\n"
        "//  另存新 PDF"
    )
    OLD_SAVE = "// ════════════════════════════════\n//  另存新 PDF"
    idx = html.rfind(OLD_SAVE)
    if idx != -1:
        html = html[:idx] + HELPER + html[idx + len(OLD_SAVE):]
        changes.append("✅ 加入 dataUrlToArrayBuffer helper")

    OLD_FETCH = re.compile(
        r'const resp = await fetch\(pg\.imageDataUrl\);\s*\n\s*const buf\s*=\s*await resp\.arrayBuffer\(\);'
    )
    html, n2 = OLD_FETCH.subn(
        "// Data URL → ArrayBuffer（不觸發網路請求，相容 CSP connect-src 'none'）\n"
        "        const buf  = dataUrlToArrayBuffer(pg.imageDataUrl);",
        html
    )
    if n2:
        changes.append("✅ 替換 fetch(data:image/...) → dataUrlToArrayBuffer()")

    # ── 8. 底部授權聲明 ───────────────────────────────────
    LICENSE = f"""
<!--
第三方開源授權聲明
Third-Party Open Source License Notice

本工具（{dist_name}）包含以下第三方開源 JavaScript 函式庫。
相關著作權與授權條款歸原作者所有。本工具以離線內嵌方式使用，未修改原始碼。

1. PDF.js v3.11.174
   Copyright (c) Mozilla Foundation and individual contributors
   License: Apache License 2.0 | SPDX: Apache-2.0
   Purpose: PDF parsing, rendering, thumbnail generation
   Source: https://github.com/mozilla/pdf.js

2. pdf-lib v1.17.1
   Copyright (c) Andrew Dillon and pdf-lib contributors
   License: MIT License | SPDX: MIT
   Purpose: PDF creation, page copying, exporting edited PDF
   Source: https://github.com/Hopding/pdf-lib

3. Mammoth.js v1.6.0
   Copyright (c) Michael Williamson and contributors
   License: BSD 2-Clause "Simplified" License | SPDX: BSD-2-Clause
   Purpose: DOCX to HTML conversion for page preview
   Source: https://github.com/mwilliamson/mammoth.js
   Note: Mammoth.js bundles JSZip (MIT) and other dependencies.

4. html2canvas v1.4.1
   Copyright (c) Niklas von Hertzen and html2canvas contributors
   License: MIT License | SPDX: MIT
   Purpose: HTML rendering to canvas image (DOCX page screenshot)
   Source: https://github.com/niklasvh/html2canvas

若本工具要於公司內網散布或長期使用，應保留各函式庫原始授權聲明、
copyright notice 與 license 條款。
-->
"""
    html = html.rstrip() + "\n" + LICENSE
    changes.append("✅ 底部第三方授權聲明")

    print("\n  資安修改項目：")
    for c in changes:
        print("   ", c)

    return html


def main():
    args = parse_args()
    license_manifest = load_manifest()
    if license_manifest.get("provisional_decisions"):
        print("授權登錄：dingbat-to-unicode 暫時引用 Mammoth BSD-2-Clause；詳見授權紀錄。")
    here = os.path.dirname(os.path.abspath(__file__))
    src_path = os.path.join(here, SRC_FILE)

    # ── 讀取版號 ──
    ver = load_version(here)
    version   = ver["version"]
    dist_name = f"pdf_editor_offline_v{version}.html"
    output_dir = args.output_dir
    if not os.path.isabs(output_dir):
        output_dir = os.path.join(here, output_dir)
    os.makedirs(output_dir, exist_ok=True)
    dist_path = os.path.join(output_dir, dist_name)

    if os.path.exists(dist_path) and not args.force:
        print(f"輸出檔已存在，為避免覆寫已停止：{dist_path}")
        print("若確認要重建，請加上 --force。")
        sys.exit(2)

    if not os.path.exists(src_path):
        print(f"❌ 找不到 {SRC_FILE}，請確認腳本與 HTML 在同一資料夾。")
        sys.exit(1)

    print("=" * 55)
    print(f"PDF 頁面編輯器 — 離線打包工具 (v{version})")
    print("=" * 55)
    print(f"  來源：{SRC_FILE}")
    print(f"  輸出：{dist_path}")

    with open(src_path, "r", encoding="utf-8") as f:
        html = f.read()

    # ── 步驟 1：下載並內嵌函式庫 ──
    print("\n[1/3] 下載函式庫")
    for lib in LIBS:
        try:
            code = download(lib["url"], lib["name"]).decode("utf-8")
            verify_bundle(lib["url"], code, license_manifest)
            inline = f"<script>/* {lib['name']} (offline embed) */\n{code}\n</script>"
            html = html.replace(lib["tag"], inline)
        except Exception as e:
            print(f"\n❌ 下載 {lib['name']} 失敗：{e}")
            sys.exit(1)

    # PDF.js Worker → Blob URL
    try:
        worker_code = download(WORKER_URL, WORKER_NAME).decode("utf-8")
        verify_bundle(WORKER_URL, worker_code, license_manifest)
        worker_json = json.dumps(worker_code)
        blob_init = (
            "const _pdfWorkerBlob = new Blob(["
            + worker_json
            + "], {type: 'application/javascript'});\n"
            "pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(_pdfWorkerBlob);"
        )
        html = re.sub(
            r"pdfjsLib\.GlobalWorkerOptions\.workerSrc\s*=\s*['\"].*?['\"];",
            lambda _: blob_init,
            html,
        )
    except Exception as e:
        print(f"\n❌ 下載 PDF.js Worker 失敗：{e}")
        sys.exit(1)

    # ── 步驟 2：套用資安強化修改 ──
    print(f"\n[2/3] 套用資安強化修改（v{version}）")
    html = apply_security(html, ver)
    html = embed_notices(html)

    # ── 步驟 3：輸出 ──
    print("\n[3/3] 寫出檔案")
    with open(dist_path, "w", encoding="utf-8") as f:
        f.write(html)

    size_kb = os.path.getsize(dist_path) // 1024
    print(f"  ✅ 輸出：{dist_name}  ({size_kb:,} KB)")

    print()
    print("=" * 55)
    print("打包完成！")
    print(f"→ {dist_name}")
    print("  · 完全離線，不需要網路")
    print("  · CSP 已啟用（禁止外部連線）")
    print("  · 第三方授權聲明已內含")
    print("=" * 55)


if __name__ == "__main__":
    main()
