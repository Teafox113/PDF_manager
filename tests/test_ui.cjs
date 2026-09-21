// npm install --no-save playwright (development only); install Chrome or set BROWSER_CHANNEL.
// Build the offline artifact first. Test documents are synthetic and kept in memory.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'))).version;
const source = fs.readFileSync(path.join(root, 'pdf_editor.html'), 'utf8');
const asset = process.env.PDF_MANAGER_ASSET || path.join(root, `release-assets/pdf_editor_offline_v${version}.html`);
const offline = fs.readFileSync(asset, 'utf8');
const blocks = text => [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
blocks(source).forEach(js => new vm.Script(js));
assert.ok(!offline.includes('-F-F'));
assert.ok(!/<script\s+src=/.test(offline));
assert.ok(offline.includes('Copyright (c) 2021, Michael Williamson'));
const screenshots = path.join(root, 'test-results');
fs.mkdirSync(screenshots, { recursive: true });
const chinese = /[\u3400-\u9fff]/;

async function downloadBytes(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

(async () => {
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce', offline: true });
    const page = await context.newPage();
    const errors = [], external = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', request => { if (/^https?:/.test(request.url())) external.push(request.url()); });
    page.on('dialog', dialog => { errors.push('Unexpected alert: ' + dialog.message()); dialog.dismiss(); });
    await page.goto(pathToFileURL(asset).href);
    await page.locator('#language-select').selectOption('en');
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.equal(await page.locator('#btn-save').innerText(), '⤓ Save PDF');
    await page.locator('#btn-about').click();
    // The bilingual language picker and untranslated license originals are intentional.
    const uiText = await page.locator('body').innerText();
    assert.equal(chinese.test(uiText.replace('Language / 語言', '').replace('繁體中文', '')), false, uiText);
    await page.getByRole('link', { name: 'Third-party licenses', exact: true }).click();
    assert.equal(await page.locator('#third-party-licenses').isVisible(), true);
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    if (await page.locator('#about-panel').isVisible()) await page.locator('#about-close').click();

    const sample = await page.evaluate(async () => {
      const pdf = await PDFLib.PDFDocument.create();
      for (let i = 1; i <= 3; i++) {
        const p = pdf.addPage([420, 594]);
        p.drawText('PDF MANAGER / TEST ' + i, { x: 30, y: 520, size: 18 });
      }
      return Array.from(await pdf.save());
    });
    await page.locator('#file-main').setInputFiles({ name: '未載入.pdf', mimeType: 'application/pdf', buffer: Buffer.from(sample) });
    await page.waitForFunction(() => state.mainPages.length === 3 && document.querySelectorAll('#left-thumbs canvas').length === 3);
    await page.locator('#left-thumbs .thumb-card').first().click();
    const stateBefore = await page.evaluate(() => ({ ids: state.mainPages.map(p => p.id), selected: [...state.selectedMain], undo: undoStack.length, name: state.mainFileName, pixels: document.querySelector('#left-thumbs canvas').toDataURL() }));
    for (const locale of ['zh-TW', 'en']) {
      await page.locator('#language-select').selectOption(locale);
      for (const theme of ['titanium', 'paper', 'ocean', 'forest']) {
        await page.locator('#theme-select').selectOption(theme);
        assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
        assert.deepEqual(await page.evaluate(() => ({ ids: state.mainPages.map(p => p.id), selected: [...state.selectedMain], undo: undoStack.length, name: state.mainFileName, pixels: document.querySelector('#left-thumbs canvas').toDataURL() })), stateBefore);
      }
      await page.screenshot({ path: path.join(screenshots, locale + '.png'), animations: 'disabled' });
    }
    assert.ok((await page.locator('#left-title').innerText()).includes('未載入.pdf'));
    assert.equal(await page.locator('.thumb-label').first().innerText(), 'Page 1');
    // Delete confirmation, cancel, actual deletion, and undo.
    await page.locator('#btn-del').click();
    assert.equal(await page.locator('#modal-msg').innerText(), 'Delete page 1?');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal(await page.evaluate(() => state.mainPages.length), 3);
    await page.locator('#btn-del').click();
    await page.locator('#modal-ok').click();
    assert.equal(await page.evaluate(() => state.mainPages.length), 2);
    await page.locator('#btn-undo').click();
    assert.equal(await page.evaluate(() => state.mainPages.length), 3);
    await page.locator('#btn-selmenu').click();
    await page.getByRole('button', { name: 'Page range…', exact: true }).click();
    assert.equal(await page.locator('#modal-title').innerText(), 'Select a page range');
    await page.locator('#modal-input').fill('1-2');
    await page.locator('#modal-ok').click();
    assert.equal(await page.evaluate(() => state.selectedMain.size), 2);
    await page.locator('#btn-bot').click();
    await page.locator('#btn-undo').click();
    // Source PDF and image insertion.
    await page.locator('#file-src').setInputFiles({ name: '來源測試.pdf', mimeType: 'application/pdf', buffer: Buffer.from(sample) });
    await page.waitForFunction(() => state.sourcePages.length === 3);
    await page.locator('#btn-src-all').click();
    await page.locator('#btn-insert').click();
    assert.equal(await page.evaluate(() => state.mainPages.length), 6);
    await page.locator('#btn-undo').click();
    const png = await page.evaluate(() => {
      const canvas = document.createElement('canvas'); canvas.width = 100; canvas.height = 40;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#bd2636'; ctx.fillRect(0, 0, 100, 40);
      return canvas.toDataURL().split(',')[1];
    });
    await page.locator('#file-src').setInputFiles({ name: 'synthetic.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
    await page.waitForFunction(() => state.sourcePages.length === 1 && state.sourcePages[0].sourceType === 'image');
    await page.locator('#btn-src-all').click();
    await page.locator('#btn-insert').click();
    assert.equal(await page.evaluate(() => state.mainPages.length), 4);
    await page.locator('#btn-undo').click();
    // Stamp image, crop / reset and export.
    await page.locator('#left-thumbs .thumb-card').first().click();
    await page.locator('#btn-stamp').click();
    await page.waitForFunction(() => document.getElementById('stamp-overlay').classList.contains('show') && stampEditor.pageSize);
    await page.locator('#file-stamp').setInputFiles({ name: 'synthetic-stamp.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
    await page.waitForFunction(() => state.mainPages[0].stamps?.length === 1);
    await page.locator('#btn-stamp-crop').click();
    assert.equal(await page.locator('#btn-stamp-crop').innerText(), 'Apply crop');
    const cropHandle = await page.locator('.stamp-crop-handle.se').boundingBox();
    await page.mouse.move(cropHandle.x + cropHandle.width / 2, cropHandle.y + cropHandle.height / 2);
    await page.mouse.down();
    await page.mouse.move(cropHandle.x - 12, cropHandle.y - 5, { steps: 4 });
    await page.mouse.up();
    await page.locator('#btn-stamp-crop').click();
    await page.locator('#btn-stamp-reset-crop').click();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    const pdfDownloadPromise = page.waitForEvent('download');
    await page.locator('#btn-save').click();
    const pdfDownload = await pdfDownloadPromise;
    const pdfBytes = await downloadBytes(pdfDownload);
    assert.equal(await page.evaluate(async bytes => (await PDFLib.PDFDocument.load(new Uint8Array(bytes))).getPageCount(), [...pdfBytes]), 3);
    assert.ok(pdfDownload.suggestedFilename().includes('未載入'));
    await page.locator('#btn-save-pages').click();
    assert.equal(await page.locator('#modal-title').innerText(), 'Export individual pages');
    await page.locator('#modal-input').fill('中文測試');
    const zipDownloadPromise = page.waitForEvent('download');
    await page.locator('#modal-ok').click();
    const zip = await downloadBytes(await zipDownloadPromise);
    let pos = 0, count = 0;
    while (zip.readUInt32LE(pos) === 0x04034b50) {
      const size = zip.readUInt32LE(pos + 18), namesize = zip.readUInt16LE(pos + 26), extra = zip.readUInt16LE(pos + 28);
      assert.ok(zip.subarray(pos + 30, pos + 30 + namesize).toString('utf8').startsWith('中文測試_'));
      count++; pos += 30 + namesize + extra + size;
    }
    assert.equal(count, 3);
    await page.setViewportSize({ width: 900, height: 700 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const statusBox = await page.locator('#statusbar').boundingBox();
    assert.ok(statusBox.y + statusBox.height <= 701);
    await page.reload();
    assert.equal(await page.locator('#language-select').inputValue(), 'en');
    assert.equal(await page.locator('#theme-select').inputValue(), 'forest');
    await page.evaluate(() => { localStorage.setItem('pdf-manager.language', 'invalid'); localStorage.setItem('pdf-manager.theme', 'invalid'); });
    await page.reload();
    assert.equal(await page.locator('#language-select').inputValue(), 'zh-TW');
    assert.equal(await page.locator('#theme-select').inputValue(), 'titanium');
    assert.deepEqual(errors, []);
    assert.deepEqual(external, [], 'Offline artifact must not request network resources');
    // Source UI is also exercised using the identical libraries from the built artifact.
    const onlineContext = await browser.newContext();
    const libs = blocks(offline).filter(js => /offline embed/.test(js.slice(0, 100)));
    const urls = [...source.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
    await onlineContext.route('https://cdnjs.cloudflare.com/**', route => {
      const idx = urls.indexOf(route.request().url());
      return idx >= 0 ? route.fulfill({ contentType: 'application/javascript', body: libs[idx] }) : route.abort();
    });
    const blocked = await onlineContext.newPage();
    const blockedErrors = [];
    blocked.on('pageerror', e => blockedErrors.push(e.message));
    await blocked.addInitScript(() => {
      Storage.prototype.getItem = () => { throw Error('blocked'); };
      Storage.prototype.setItem = () => { throw Error('blocked'); };
    });
    await blocked.goto(pathToFileURL(path.join(root, 'pdf_editor.html')).href);
    await blocked.locator('#language-select').selectOption('en');
    await blocked.locator('#theme-select').selectOption('paper');
    assert.equal(await blocked.locator('#btn-del').innerText(), '✕ Delete selected');
    assert.deepEqual(blockedErrors, []);
    console.log('PASS: bilingual UI, four themes, preserved document state, Chinese filenames, delete/cancel/undo, range, reorder, PDF/image insertion, image stamp/crop, PDF/ZIP export, preferences, blocked storage, narrow layout, source smoke test, offline no-network and license dialog.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
