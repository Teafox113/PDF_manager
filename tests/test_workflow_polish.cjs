// Only synthetic PDF content. Downloads are captured in memory, not saved.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'version.json'))).version;
const asset=process.env.PDF_MANAGER_ASSET||path.join(root,`release-assets/pdf_editor_offline_v${version}.html`);
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 try {
  const context=await browser.newContext({offline:true,viewport:{width:1440,height:1000}}),page=await context.newPage();
  const errors=[],requests=[],dialogs=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});
  await page.goto(pathToFileURL(asset).href);await page.locator('#language-select').selectOption('en');
  const bytes=await page.evaluate(async()=>{const d=await PDFLib.PDFDocument.create();d.addPage([420,594]).drawText('SYNTHETIC_ORIGINAL',{x:25,y:25,size:12});return Array.from(await d.save());});
  await page.locator('#file-main').setInputFiles({name:'workflow.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)});
  await page.waitForFunction(()=>state.mainPages.length===1&&!documentIO.busy);
  assert.equal(await page.evaluate(()=>hasUnexportedChanges()),false);
  await page.locator('#left-thumbs .thumb-card').dblclick();await page.waitForFunction(()=>stampEditor.pageSize);
  await page.locator('#pe-text').click();await page.locator('#pe-text-value').fill('Workflow polish\nDraft safety');
  assert.equal(await page.evaluate(()=>hasUnexportedChanges()),true);
  assert.ok((await page.locator('#pe-draft-status').innerText()).includes('Draft not applied'));
  await page.locator('#pe-font-size').fill('0');
  assert.equal(await page.locator('#pe-text-value').getAttribute('aria-invalid'),'true');
  await page.locator('#pe-apply').click();assert.ok(dialogs.pop().includes('Font size must'));
  assert.equal(await page.evaluate(()=>undoStack.length),0);
  await page.locator('#pe-font-size').fill('18');await page.locator('#pe-apply').click();
  assert.equal(await page.evaluate(()=>undoStack.length),1);
  await page.locator('.stamp-item').click();assert.equal(await page.evaluate(()=>undoStack.length),1,'selection is not an edit');
  await page.locator('.stamp-item').dblclick();await page.locator('#pe-apply').click();
  assert.equal(await page.evaluate(()=>undoStack.length),1,'unchanged text is not an edit');
  const original=await page.evaluate(()=>({x:getActiveStamp().x,y:getActiveStamp().y}));
  let b=await page.locator('.stamp-item').boundingBox();
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+30,b.y+b.height/2+15,{steps:5});await page.mouse.up();
  assert.equal(await page.evaluate(()=>undoStack.length),2,'one history item per drag');
  const moved=await page.evaluate(()=>({x:getActiveStamp().x,y:getActiveStamp().y}));assert.notDeepEqual(original,moved);
  await page.locator('#pe-undo').click();assert.deepEqual(await page.evaluate(()=>({x:state.mainPages[0].stamps[0].x,y:state.mainPages[0].stamps[0].y})),original);
  await page.locator('#pe-redo').click();assert.deepEqual(await page.evaluate(()=>({x:state.mainPages[0].stamps[0].x,y:state.mainPages[0].stamps[0].y})),moved);
  await page.keyboard.press('Control+z');await page.waitForFunction(()=>redoStack.length===1);
  await page.keyboard.press('Control+Shift+Z');await page.waitForFunction(()=>redoStack.length===0);
  // Resize while a draft is active; page and text remain accessible.
  await page.locator('.stamp-item').dblclick();await page.locator('#pe-text-value').fill('Responsive draft');
  await page.setViewportSize({width:900,height:700});
  await page.waitForFunction(()=>document.getElementById('stamp-page-canvas').width<800);
  let canvas=await page.locator('#stamp-page-canvas').boundingBox(),work=await page.locator('#stamp-work').boundingBox();
  assert.ok(canvas.x>=work.x && canvas.x+canvas.width<=work.x+work.width+1,'no inaccessible left edge');
  assert.equal(await page.locator('#pe-text-value').inputValue(),'Responsive draft');
  await page.evaluate(()=>{document.documentElement.dataset.theme='paper';});
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});await page.screenshot({path:path.join(root,'test-results/workflow-polish-paper.png'),animations:'disabled'});
  assert.equal(await page.locator('#pe-text').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(243, 246, 250)');
  await page.locator('#pe-apply').click();await page.locator('#stamp-toolbar button.success').click();
  await page.setViewportSize({width:1440,height:1000});
  // Cancellation and failed replacement retain document and history.
  await page.locator('#file-main').setInputFiles({name:'invalid.pdf',mimeType:'application/pdf',buffer:Buffer.from('not a PDF')});
  assert.equal(await page.locator('#modal-title').innerText(),'Replace the main document?');
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>state.mainFileName),'workflow.pdf');
  const count=await page.evaluate(()=>undoStack.length);
  await page.locator('#file-main').setInputFiles({name:'invalid.pdf',mimeType:'application/pdf',buffer:Buffer.from('not a PDF')});
  await page.locator('#modal-ok').click();await page.waitForFunction(()=>!documentIO.busy);
  assert.ok(dialogs.pop().includes('session is preserved'));assert.equal(await page.evaluate(()=>undoStack.length),count);
  assert.equal(await page.evaluate(()=>state.mainFileName),'workflow.pdf');
  assert.equal(await page.evaluate(()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented;}),true);
  // Export captures an immutable snapshot and blocks overlapping commands.
  await page.evaluate(()=>{
   window.originalAppend=appendPageToPdfDocument;window.originalDownload=downloadDocument;
   downloadDocument=(data,type,name)=>{window.capturedDownload={data:Array.from(data),type,name};};
   window.exportGate=new Promise(resolve=>window.resumeExport=resolve);
   appendPageToPdfDocument=async(...args)=>{window.exportPage=args[1];await window.exportGate;return window.originalAppend(...args);};
   window.pendingExport=saveAsPDF();
  });
  await page.waitForFunction(()=>!!window.exportPage);
  assert.equal(await page.evaluate(()=>document.getElementById('toolbar').inert&&documentIO.busy),true);
  await page.keyboard.press('Control+z');assert.equal(await page.evaluate(()=>undoStack.length),count);
  assert.equal(await page.evaluate(()=>window.exportPage!==state.mainPages[0]&&window.exportPage.stamps[0].content!==state.mainPages[0].stamps[0].content),true);
  await page.evaluate(async()=>{await saveAsPDF();window.resumeExport();await window.pendingExport;appendPageToPdfDocument=window.originalAppend;});
  assert.equal(await page.evaluate(()=>documentIO.busy),false);assert.equal(await page.evaluate(()=>hasUnexportedChanges()),false);
  const exported=await page.evaluate(async()=>{const d=await PDFLib.PDFDocument.load(new Uint8Array(window.capturedDownload.data));return {pages:d.getPageCount(),name:window.capturedDownload.name};});
  assert.deepEqual(exported,{pages:1,name:'workflow_edited.pdf'});
  // Undo and redo restore the exported revision marker.
  await page.locator('#btn-undo').click();assert.equal(await page.evaluate(()=>hasUnexportedChanges()),true);
  await page.locator('#btn-redo').click();assert.equal(await page.evaluate(()=>hasUnexportedChanges()),false);
  // Export failure must unlock controls and leave unexported work dirty.
  await page.evaluate(()=>{snapshotForUndo();state.mainPages[0].stamps[0].x+=1;appendPageToPdfDocument=async()=>{throw Error('Synthetic failure');};});
  await page.locator('#btn-save').click();await page.waitForFunction(()=>!documentIO.busy);
  assert.ok(dialogs.pop().includes('Synthetic failure'));assert.equal(await page.evaluate(()=>hasUnexportedChanges()),true);
  assert.equal(await page.evaluate(()=>document.getElementById('toolbar').inert),false);
  await page.evaluate(()=>{appendPageToPdfDocument=window.originalAppend;});
  // Redo is discarded by a new edit and a successful replacement resets history.
  await page.locator('#btn-undo').click();await page.evaluate(()=>{snapshotForUndo();state.mainPages[0].stamps[0].x+=2;});
  assert.equal(await page.evaluate(()=>redoStack.length),0);
  await page.locator('#file-main').setInputFiles({name:'replacement.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)});
  await page.locator('#modal-ok').click();await page.waitForFunction(()=>!documentIO.busy&&state.mainFileName==='replacement.pdf');
  assert.deepEqual(await page.evaluate(()=>[undoStack.length,redoStack.length,hasUnexportedChanges()]),[0,0,false]);
  // Erasure history must not reintroduce the original PDF when redone/exported.
  await page.locator('#left-thumbs .thumb-card').dblclick();await page.waitForFunction(()=>stampEditor.pageSize);
  await page.evaluate(()=>runPageTask(()=>erasePageArea(getActiveStampPage(),{x:0,y:0,width:30,height:30})));
  assert.equal(await page.evaluate(()=>!!state.mainPages[0].pdfBytes),false);
  await page.locator('#pe-undo').click();assert.equal(await page.evaluate(()=>!!state.mainPages[0].pdfBytes),true);
  await page.locator('#pe-redo').click();assert.equal(await page.evaluate(()=>!!state.mainPages[0].pdfBytes),false);
  const erased=await page.evaluate(async()=>{const d=await PDFLib.PDFDocument.create();await appendPageToPdfDocument(d,state.mainPages[0],new Map());const bytes=await saveEditedPdf(d,state.mainPages);const pdf=await pdfjsLib.getDocument({data:bytes}).promise;const text=(await (await pdf.getPage(1)).getTextContent()).items.map(i=>i.str).join('');await pdf.destroy();return text;});
  assert.equal(erased,'','redo exports the replacement, not original PDF streams');
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);assert.deepEqual(dialogs,[]);
  console.log('PASS workflow: real undo/redo, no-op selection/edit, grouped drag, live validation, responsive draft, atomic replacement, unsaved guard, export snapshot/locking/failure recovery, private offline operation.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
