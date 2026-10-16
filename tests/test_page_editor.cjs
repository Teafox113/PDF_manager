// Synthetic documents and clipboard data only; no private fixtures.
const fs=require('node:fs'), path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'))).version;
const asset=process.env.PDF_MANAGER_ASSET||path.join(root,`release-assets/pdf_editor_offline_v${version}.html`);
async function paste(page,html,text='') {
  await page.evaluate(({html,text})=>{
    const data=new DataTransfer();if(html)data.setData('text/html',html);if(text)data.setData('text/plain',text);
    document.getElementById('stamp-page-wrap').dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));
  },{html,text});
}
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 try{
  const context=await browser.newContext({offline:true,viewport:{width:1440,height:1100}});
  const page=await context.newPage(),errors=[],requests=[],dialogs=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});
  await page.goto(pathToFileURL(asset).href);
  await page.locator('#language-select').selectOption('en');
  assert.equal(await page.locator('#btn-page-edit').innerText(),'✎ Edit page');
  const bytes=await page.evaluate(async()=>{
    const d=await PDFLib.PDFDocument.create();const p=d.addPage([420,594]);
    p.drawText('PRIVATE_TEST_MARKER_87291',{x:20,y:500,size:13});
    p.drawText('UNERASED_VISIBLE_TEXT',{x:20,y:50,size:13});
    const c=document.createElement('canvas');c.width=40;c.height=40;const ctx=c.getContext('2d');ctx.fillStyle='#ff00ff';ctx.fillRect(0,0,40,40);
    const image=await d.embedPng(c.toDataURL());p.drawImage(image,{x:30,y:420,width:50,height:50});
    return Array.from(await d.save());
  });
  await page.locator('#file-main').setInputFiles({name:'synthetic-private-test.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)});
  await page.waitForFunction(()=>state.mainPages.length===1);
  await page.locator('#left-thumbs .thumb-card').dblclick();
  await page.waitForFunction(()=>stampEditor.pageSize && document.getElementById('stamp-overlay').classList.contains('show'));
  await paste(page,'<table><tr><td>A</td><td>B<img src="https://example.invalid/no-fetch" onerror="window.injection=true"></td></tr><tr><td>1</td><td>2<script>window.injection=true</script></td></tr></table>','A\tB\n1\t2');
  await page.locator('#pe-grid input').nth(0).fill('修改過的標題');
  await page.locator('#pe-grid input').nth(1).click();await page.locator('#pe-add-col').click();
  assert.equal(await page.locator('#pe-grid tr').first().locator('input').count(),3);
  await page.locator('#pe-add-row').click();assert.equal(await page.locator('#pe-grid tr').count(),3);
  await page.locator('#pe-grid tr').nth(1).locator('input').nth(2).fill('新增內容');
  await page.locator('#pe-remove-col').click();assert.equal(await page.locator('#pe-grid tr').first().locator('input').count(),2);
  await page.locator('#pe-remove-row').click();assert.equal(await page.locator('#pe-grid tr').count(),2);
  assert.equal(await page.evaluate(()=>window.injection),undefined);
  await page.locator('#pe-apply').click();await page.waitForFunction(()=>state.mainPages[0].stamps?.length===1);
  assert.equal(await page.evaluate(()=>getActiveStamp().content.rows[0][0]),'修改過的標題');
  await page.locator('#pe-edit').click();await page.locator('#pe-grid input').first().fill('SECOND EDIT');await page.locator('#pe-apply').click();
  await page.locator('#pe-undo').click();
  assert.equal(await page.evaluate(()=>state.mainPages[0].stamps[0].content.rows[0][0]),'修改過的標題','deep undo clone');
  await page.locator('#pe-text').click();await page.locator('#pe-text-value').fill('中文測試 English\n第二行');
  await page.locator('#pe-font-size').fill('24');await page.locator('#pe-bold').check();await page.locator('#pe-apply').click();
  assert.equal(await page.evaluate(()=>getActiveStamp().content.text),'中文測試 English\n第二行');
  await page.locator('#pe-edit').click();await page.keyboard.press('Control+A');await page.keyboard.press('Backspace');
  assert.equal(await page.evaluate(()=>state.mainPages.length),1,'typing must not delete a PDF page');
  await page.keyboard.press('Escape');
  await page.evaluate(()=>{
    const c=document.createElement('canvas');c.width=30;c.height=80;const x=c.getContext('2d');x.fillStyle='green';x.fillRect(0,0,30,80);
    const binary=atob(c.toDataURL().split(',')[1]);const bytes=Uint8Array.from(binary,ch=>ch.charCodeAt(0));
    const data=new DataTransfer();data.items.add(new File([bytes],'synthetic.png',{type:'image/png'}));
    document.getElementById('stamp-page-wrap').dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));
  });
  await page.waitForFunction(()=>!pageEdit.busy && state.mainPages[0].stamps.length===3);
  await page.locator('#pe-paste').focus();await page.keyboard.press('Delete');
  assert.equal(await page.evaluate(()=>state.mainPages[0].stamps.length),2);assert.equal(await page.evaluate(()=>state.mainPages.length),1);
  await page.locator('#pe-undo').click();assert.equal(await page.evaluate(()=>state.mainPages[0].stamps.length),3);
  // Sanitized merged cells, TSV, size limits, and button permission fallback.
  const parsed=await page.evaluate(()=>({merged:parseClipboardTable('<table><tr><td rowspan="2">M</td><td>V</td></tr><tr><td>W</td></tr></table>',''),tsv:parseClipboardTable('','X\tY\n7\t8\n')}));
  assert.deepEqual(parsed.merged.rows,[['M','V'],['','W']]);assert.equal(parsed.merged.merged,true);
  assert.deepEqual(parsed.tsv.rows,[['X','Y'],['7','8']]);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{read:async()=>{throw Error('denied');}}}));
  await page.locator('#pe-paste').click();assert.ok(dialogs.pop().includes('Ctrl+V'));
  // Compact content preview screenshots contain only synthetic data.
  await page.evaluate(()=>{getActiveStampPage().stamps.forEach((s,i)=>{s.x=150;s.y=210+i*85;s.width=200;s.height=200*s.naturalH/s.naturalW; if(s.height>75){s.width*=75/s.height;s.height=75;}});renderStampOverlays();});
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
  await page.screenshot({path:path.join(root,'test-results/page-editor-en.png')});
  await page.evaluate(()=>I18N.setLanguage('zh-TW'));
  await page.screenshot({path:path.join(root,'test-results/page-editor-zh.png')});
  await page.evaluate(()=>I18N.setLanguage('en'));
  // Adding objects must preserve original searchable text before erasure.
  const text=await page.evaluate(async()=>{
    const out=await PDFLib.PDFDocument.create();await appendPageToPdfDocument(out,getActiveStampPage(),new Map());
    const pdf=await pdfjsLib.getDocument({data:await out.save()}).promise;
    const pg=await pdf.getPage(1);const text=(await pg.getTextContent()).items.map(t=>t.str).join(' ');await pdf.destroy();return text;
  });
  assert.ok(text.includes('PRIVATE_TEST_MARKER_87291'));assert.ok(text.includes('UNERASED_VISIBLE_TEXT'));
  assert.equal(await page.locator('#pe-erase').isDisabled(),false);
  await page.evaluate(()=>{document.getElementById('stamp-work').scrollTop=0;});
  async function eraseGesture(){
    await page.locator('#pe-erase').click();const b=await page.locator('#stamp-page-canvas').boundingBox();
    await page.mouse.move(b.x+2,b.y+2);await page.mouse.down();await page.mouse.move(b.x+b.width*.85,b.y+b.height*.32,{steps:8});await page.mouse.up();
  }
  await eraseGesture();await page.locator('#modal-overlay button').last().click();
  assert.equal(await page.evaluate(()=>state.mainPages[0].sourceType),'main_pdf');
  await eraseGesture();await page.locator('#modal-ok').click();
  await page.waitForFunction(()=>!pageEdit.busy&&state.mainPages[0].rasterized);
  assert.equal(await page.evaluate(()=>!!state.mainPages[0].pdfBytes),false);
  await page.locator('#pe-undo').click();
  assert.equal(await page.evaluate(()=>state.mainPages[0].sourceType),'main_pdf');
  assert.equal(await page.evaluate(()=>state.mainPages[0].stamps.length),3);
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);assert.deepEqual(dialogs,[]);
  console.log('PASS: text/table editing, row/column changes, clipboard image/HTML/TSV, sanitized HTML, undo, keyboard isolation, erase gesture/cancel/confirm/undo, original text retained before erasure, no-network.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
