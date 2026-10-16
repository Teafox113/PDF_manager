# PDF Manager

English · [繁體中文](README.md)

> **v2.8.1-F** adds editable text/tables and clipboard images. Ordinary links no longer block erasure; rejection messages identify the main-PDF page and reason. Added objects are flattened on export.

### Page editor

- Select a main page and click Edit page, or double-click it. Use Ctrl+V to paste images, tables or text; the clipboard button depends on browser permissions.
- Move/resize added objects; double-click text or tables to edit. Tables support cell editing and row/column insertion/deletion. Existing PDF tables are not converted to editable cells.
- Area erasure replaces the edited page with a raster image, **not the whole document**. Other pages retain searchable text. Confirm before applying; session undo is available and source files are not overwritten.
- Project-owned resource pruning removes unused shared resources and unreachable objects on PDF and per-page ZIP export. Original images still used on another page, or unsupported structures, cause rejection rather than modifying other pages.
- Ordinary HTTP(S)/mailto links and explicit internal page destinations on other pages are rebuilt safely. Links on the rasterized page are removed; links pointing to that page remain. Links to removed/absent destination pages (including per-page ZIP output) are omitted rather than importing hidden source pages.
- Forms, signatures, other annotations, JavaScript/chained actions, custom link appearances, unresolved destinations, layers, inline images (BI), Type3 fonts and some patterns/shadings/soft masks remain unsupported. Rejections report the main-PDF page and category, or a document-level scope. This is not document-wide sanitization.
- No MuPDF/EmbedPDF/PDFium or new AGPL dependency is included. Existing third-party notices remain. A formal license for project-owned code still needs to be selected.

A browser-based, page-oriented tool for organizing and combining PDFs without sending documents to an online conversion service.

Current version: **v2.8.1-F**. The interface supports **Traditional Chinese / English** and four selectable themes.

This update adds page-content editing and limited area erasure, retaining the earlier stamp-coordinate fixes for rotated PDFs.

## Features

- **Organize pages:** delete, drag to reorder, move groups, rotate, and undo up to 30 steps.
- **Insert content:** add pages from other PDFs, images, or DOCX documents; select and drag multiple source pages together.
- **Combine pages:** stack multiple source pages vertically into a single page.
- **Place stamps:** import image or PDF stamps, then move, resize, flip, or crop them.
- **Edit pages:** add text, paste images/tables, edit table cells and rows/columns, and erase areas in supported documents.
- **Export:** save the entire PDF, or export individual pages as separate PDFs in a ZIP archive.
- **Customize the workspace:** switch languages instantly, choose one of four themes, change thumbnail size, and resize the side panel.

The editor can add text but cannot directly modify existing PDF text. OCR and digital-signature services are not included. Image stamping overlays an image; it is not a verifiable digital signature.

## Quick start

For offline use, visit the [v2.8.1-F release page](https://github.com/Teafox113/PDF_manager/releases/tag/v2.8.1-F), download `pdf_editor_offline_v2.8.1-F.html`, and open it in desktop Chrome or Edge.

1. Download or clone the project and open [pdf_editor.html](pdf_editor.html) in desktop Chrome or Edge.
2. Choose **Language / 語言** and **Theme** in the toolbar.
3. Click **Open main PDF**. Open source files on the right when you want to insert content.
4. Click **Save PDF** to download the result. Edits do not overwrite your original document directly.

The source HTML may need an internet connection on every launch to load pinned CDN libraries. Opening it once does not guarantee future offline availability. Editing sessions are not saved automatically; download your result before closing or reloading the page.

## Languages and themes

Switching language updates the toolbar, menus, hints, status messages, confirmation dialogs, and stamp editor. It does not translate document content or user filenames, or reset pages and undo history. Traditional Chinese is the default.

| Theme | Appearance |
| --- | --- |
| Titanium | Warm charcoal with champagne accents (default) |
| Paper | White workspace, soft gray background, blue accents |
| Ocean | Deep navy with ice-blue accents |
| Forest | Dark green with sage accents |

When browser storage is available, the application remembers language, theme, and panel width. It still works with storage disabled, but preferences will not persist. Themes do not change PDF, stamp, or export colors.

## Build the offline edition

Requires **Python 3.10 or newer** and an internet connection during the build. No npm installation is needed.

Run from the project root:

```sh
python build_offline.py
```

Output:

```text
release-assets/pdf_editor_offline_v2.8.1-F.html
```

Open that file directly in your browser. The builder verifies library and license-file hashes, embeds dependencies and full third-party notices, and refuses to overwrite an existing output by default. Offline HTML files are excluded from Git history and provided as GitHub Release assets.

## Privacy and data

- Document parsing, editing, and export run locally in the browser. The application has no document-upload API.
- The source edition requests JavaScript from cdnjs. This is not a document upload, but the source edition is not fully offline.
- The offline artifact embeds its libraries and uses a Content Security Policy to restrict external connections.
- `localStorage` stores interface preferences, not document content.
- For confidential material, use a verified offline build and follow your organization's data-handling rules. Functional testing is not a comprehensive security audit.

## Limitations

- Legacy `.doc` is unsupported. DOCX conversion may not preserve Word layout exactly. DOCX cannot be batch-loaded together with PDFs or images; if several DOCX files are selected, only the first is processed.
- Password-protected, unusually encrypted, or malformed PDFs may not load.
- Rotating a PDF page currently rasterizes it at approximately 1200 pixels wide, which may remove selectable text and increase file size.
- Large documents, images, and undo snapshots can consume substantial memory.
- Desktop browsers are the primary target. Firefox, Safari, and mobile interfaces have not been fully verified.
- Existing pinned library versions are retained. This update does not include a comprehensive dependency-vulnerability audit; do not treat unknown documents as trusted.

## Project structure

```text
pdf_editor.html           Bilingual application with four themes
version.json              Release version configuration
build_offline.py          Offline builder
license_bundle.py         Third-party notice and hash validation
README.md                 Traditional Chinese documentation
licenses/                 Upstream licenses and provenance
THIRD_PARTY_NOTICES.txt    Complete third-party notices
docs/                     Testing, limitations, and development notes
tests/                    License and browser tests
release-assets/           Local offline builds (HTML excluded from Git)
```

## Dependencies and licensing

| Library | Version | Declared license |
| --- | --- | --- |
| PDF.js | 3.11.174 | Apache-2.0 |
| pdf-lib | 1.17.1 | MIT |
| html2canvas | 1.4.1 | MIT |
| Mammoth | 1.6.0 | BSD-2-Clause |

Third-party components and their dependencies retain their own license terms. This summary does not replace the [complete notices](THIRD_PARTY_NOTICES.txt). See [licenses](licenses/README.md) for provenance and hashes.

`dingbat-to-unicode 1.0.1` now includes its own BSD-2-Clause notice (Copyright 2021, Michael Williamson), based on the [maintainer's confirmation that the license also covers previous versions](https://github.com/mwilliamson/dingbat-to-unicode/issues/1#issuecomment-5740760399). Its notice no longer relies on the provisional Mammoth reference.

**No open-source license has been selected for PDF Manager's own code.** Third-party licenses do not automatically license the application as a whole. See [project license status](PROJECT_LICENSE_STATUS.md).

## Testing and issue reports

```sh
python -m unittest discover -s tests -v
```

The development browser test additionally requires Node.js, Playwright, and Chrome. Build the offline artifact first, then run:

```sh
npm install --no-save --package-lock=false playwright
node tests/test_ui.cjs
```

Node.js and Playwright are test-only dependencies, not requirements for using or building the application. See the [test report](docs/TEST_REPORT.md) and [known limitations](docs/KNOWN_ISSUES.md).

When reporting an issue, include the version, browser, reproduction steps, and redacted screenshots. Do not publicly upload personal information, internal PDFs, original stamp images, or credentials.

## Contact

For questions, support, or feature suggestions, please leave a message in this project's [GitHub Issues](https://github.com/Teafox113/PDF_manager/issues). Do not include personal information, confidential documents, or credentials in public comments.
