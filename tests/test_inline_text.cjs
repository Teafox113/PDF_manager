// Synthetic data only. No user documents, downloads or network requests.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'version.json'))).version;
const asset=process.env.PDF_MANAGER_ASSET||path.join(root,`release-assets/pdf_editor_offline_v${version}.html`);
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 try {
  const context=await browser.newContext({offline:true,viewport:{width:1440,height:1100}}),page=await context.newPage();
  const errors=[],requests=[],dialogs=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});
  await page.goto(pathToFileURL(asset).href);
  const bytes=await page.evaluate(async()=>{const d=await PDFLib.PDFDocument.create();d.addPage([420,594]).drawText('ORIGINAL_SEARCHABLE',{x:20,y:30,size:10});return Array.from(await d.save());});
  await page.locator('#file-main').setInputFiles({name:'synthetic-inline.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)});
  await page.waitForFunction(()=>state.mainPages.length===1);
  await page.locator('#left-thumbs .thumb-card').dblclick();
  await page.waitForFunction(()=>stampEditor.pageSize);
  await page.locator('#pe-text').click();
  assert.equal(await page.locator('#page-content-overlay').isVisible(),false);
  assert.equal(await page.locator('#stamp-page-wrap > #pe-text-value').count(),1);
  await page.locator('#pe-text-value').fill('直接在頁面輸入\nWord-like editing\n第三行');
  await page.locator('#pe-font-family').selectOption('Arial');
  await page.locator('#pe-font-size').fill('24');
  await page.locator('#pe-color').fill('#c02030');
  await page.locator('#pe-bold').check();await page.locator('#pe-italic').check();await page.locator('#pe-underline').check();
  await page.locator('#pe-align').selectOption('center');await page.locator('#pe-line-height').selectOption('1.6');
  await page.locator('#pe-text-width').fill('300');
  const style=await page.locator('#pe-text-value').evaluate(el=>({color:getComputedStyle(el).color,align:getComputedStyle(el).textAlign,font:getComputedStyle(el).fontStyle}));
  assert.deepEqual(style,{color:'rgb(192, 32, 48)',align:'center',font:'italic'});
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
  await page.screenshot({path:path.join(root,'test-results/inline-text-zh.png')});
  await page.evaluate(()=>I18N.setLanguage('en'));
  assert.equal(await page.locator('#pe-inline-hint').innerText(),'Type on the page; formatting affects the whole text box. Ctrl+Enter to finish, Esc to cancel; drag after finishing.');
  await page.screenshot({path:path.join(root,'test-results/inline-text-en.png')});
  await page.setViewportSize({width:900,height:700});
  const toolbarBounds=await page.locator('#pe-text-toolbar').boundingBox();
  assert.ok(toolbarBounds.x>=0 && toolbarBounds.x+toolbarBounds.width<=900,'toolbar stays inside narrow viewport');
  assert.equal(await page.locator('#pe-apply').isVisible(),true);
  await page.screenshot({path:path.join(root,'test-results/inline-text-narrow.png')});
  await page.setViewportSize({width:1440,height:1100});
  // IME Enter/Escape must not finish or cancel an in-progress composition.
  await page.locator('#pe-text-value').evaluate(el=>{
   el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',ctrlKey:true,isComposing:true,bubbles:true}));
   el.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',isComposing:true,bubbles:true}));
  });
  assert.equal(await page.evaluate(()=>pageEdit.draft?.kind),'text');
  await page.locator('#pe-text-value').focus();await page.keyboard.press('Control+Enter');
  assert.equal(await page.locator('#pe-text-toolbar').isVisible(),false);
  let saved=await page.evaluate(()=>({st:getActiveStamp(),undo:undoStack.length}));
  assert.equal(saved.st.content.text,'直接在頁面輸入\nWord-like editing\n第三行');
  assert.equal(saved.st.content.fontFamily,'Arial');assert.equal(saved.st.content.italic,true);assert.equal(saved.st.content.underline,true);
  assert.equal(saved.st.width,300);assert.equal(saved.undo,1);
  await page.screenshot({path:path.join(root,'test-results/inline-text-applied.png')});
  // PDF export retains the original text and the styled red added text geometry.
  const exported=await page.evaluate(async()=>{
   const pg=getActiveStampPage(),preview=document.createElement('canvas');await renderPagePreviewToCanvas(pg,preview,840);await drawStampsOnCanvas(preview,pg);
   const d=await PDFLib.PDFDocument.create();await appendPageToPdfDocument(d,pg,new Map());
   const pdf=await pdfjsLib.getDocument({data:await saveEditedPdf(d,state.mainPages)}).promise,p=await pdf.getPage(1);
   const text=(await p.getTextContent()).items.map(x=>x.str).join(' '),v=p.getViewport({scale:2}),canvas=document.createElement('canvas');canvas.width=v.width;canvas.height=v.height;
   await p.render({canvasContext:canvas.getContext('2d'),viewport:v}).promise;
   const bounds=c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let minX=c.width,minY=c.height,maxX=-1,maxY=-1,count=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4;if(a[i]>110&&a[i]>a[i+1]*1.6&&a[i]>a[i+2]*1.6){count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}return {count,minX,minY,maxX,maxY};};
   const result={text,preview:bounds(preview),output:bounds(canvas)};await pdf.destroy();return result;
  });
  assert.ok(exported.text.includes('ORIGINAL_SEARCHABLE'));assert.ok(exported.output.count>100);
  for(const k of ['minX','minY','maxX','maxY'])assert.ok(Math.abs(exported.preview[k]-exported.output[k])<=2,`export ${k}`);
  await page.locator('#pe-edit').click();
  await page.locator('#pe-text-value').focus();await page.keyboard.press('Control+A');await page.keyboard.press('Backspace');await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>getActiveStamp().content.text),saved.st.content.text,'Esc discards draft');
  assert.equal(await page.evaluate(()=>undoStack.length),saved.undo);
  // Reopen, edit with keyboard shortcuts, click another tool to commit first.
  await page.locator('#pe-edit').click();await page.locator('#pe-text-value').fill('Updated text');
  await page.locator('#pe-text-value').focus();await page.keyboard.press('Control+B');await page.keyboard.press('Control+I');await page.keyboard.press('Control+U');
  await page.locator('#pe-table').click();
  assert.equal(await page.evaluate(()=>state.mainPages[0].stamps[0].content.text),'Updated text');
  assert.equal(await page.evaluate(()=>state.mainPages[0].stamps[0].content.bold),false);
  assert.equal(await page.locator('#page-content-overlay').isVisible(),true);
  await page.locator('#pe-cancel').click();await page.locator('#pe-undo').click();
  assert.equal(await page.evaluate(()=>state.mainPages[0].stamps[0].content.text),saved.st.content.text);
  // Long text is refused without committing or silently reducing the font size.
  await page.locator('.stamp-item').dblclick();
  assert.equal(await page.locator('#pe-text-value').isVisible(),true,'double-click opens inline editing');
  await page.locator('#pe-text-value').fill('line\n'.repeat(30));await page.locator('#pe-apply').click();
  assert.ok(dialogs.pop().includes('page bounds'));assert.equal(await page.evaluate(()=>!!pageEdit.draft),true);
  await page.keyboard.press('Escape');
  // Clearing existing text removes only that object; page undo restores it.
  await page.locator('#pe-edit').click();await page.locator('#pe-text-value').fill('');await page.locator('#pe-apply').click();
  assert.equal(await page.evaluate(()=>state.mainPages[0].stamps.length),0);await page.locator('#pe-undo').click();
  assert.equal(await page.evaluate(()=>state.mainPages[0].stamps.length),1);
  // Closing the page editor commits the draft. No extra modal window is opened.
  await page.locator('#pe-text').click();await page.locator('#pe-text-value').fill('<img src="https://example.invalid/no-fetch">');
  await page.locator('#stamp-toolbar button.success').click();
  assert.equal(await page.evaluate(()=>state.mainPages[0].stamps.length),2);
  assert.equal(await page.locator('#stamp-overlay').isVisible(),false);
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);assert.deepEqual(dialogs,[]);
  console.log('PASS inline text: on-page typing, toolbar, bilingual UI, IME isolation, keyboard shortcuts, cancel/commit/undo, bounds refusal, literal markup, exported geometry and preserved original text; offline.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
