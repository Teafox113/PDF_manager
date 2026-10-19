// Synthetic documents only; all output is intercepted in memory. No network.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'version.json'))).version;
const asset=process.env.PDF_MANAGER_ASSET||path.join(root,`release-assets/pdf_editor_offline_v${version}.html`);
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 try {
  const context=await browser.newContext({offline:true,viewport:{width:1440,height:960}}),page=await context.newPage();
  const errors=[],requests=[],dialogs=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});
  await page.goto(pathToFileURL(asset).href);await page.locator('#language-select').selectOption('en');
  const bytes=await page.evaluate(async()=>{const d=await PDFLib.PDFDocument.create();for(let i=0;i<4;i++)d.addPage([420,594]).drawText('SYNTHETIC '+i,{x:30,y:500,size:16});window.sample=Array.from(await d.save());return window.sample;});
  const file=name=>({name,mimeType:'application/pdf',buffer:Buffer.from(bytes)});
  await page.locator('#file-main').setInputFiles(file('main.pdf'));await page.waitForFunction(()=>!documentIO.busy&&state.mainPages.length===4);
  await page.locator('#file-src').setInputFiles(file('old.pdf'));await page.waitForFunction(()=>!documentIO.busy&&state.sourcePages.length===4);
  await page.evaluate(()=>state.selectedSource.set(1,true));
  const before=await page.evaluate(()=>({ids:state.sourcePages.map(p=>p.id),main:state.mainPages.map(p=>p.id),selected:[...state.selectedSource],name:state.sourceFileName,count:state.sourceFileCount}));
  const readState=()=>page.evaluate(()=>({ids:state.sourcePages.map(p=>p.id),main:state.mainPages.map(p=>p.id),selected:[...state.selectedSource],name:state.sourceFileName,count:state.sourceFileCount}));
  // Failing the second file must not expose the first file or discard old selection.
  await page.locator('#file-src').setInputFiles([file('good.pdf'),{name:'broken.pdf',mimeType:'application/pdf',buffer:Buffer.from('invalid')}]);
  await page.waitForFunction(()=>!documentIO.busy);assert.deepEqual(await readState(),before);
  assert.match(dialogs.pop(),/preserved.*\(2\/2\)/);
  // Reject invalid image bytes, legacy DOC, and unsupported mixed batch instead of silent loss.
  for(const name of ['bad.png','old.doc','unknown.txt','bad.docx']) {
   await page.evaluate(async name=>loadSourceFiles([new File(['invalid'],name)]),name);
   assert.deepEqual(await readState(),before);assert.ok(dialogs.pop());
  }
  await page.evaluate(async()=>loadSourceFiles([new File(['x'],'a.docx'),new File(['x'],'b.docx')]));
  assert.match(dialogs.pop(),/one DOCX/);assert.deepEqual(await readState(),before);
  assert.equal(await page.locator('#docx-iframe-wrap').evaluate(el=>el.children.length),0);
  // Real DOCX pagination renderer with injected conversion result. A failed page
  // must reject the whole batch; temporary iframe is always removed.
  await page.evaluate(async()=>{
   const convert=mammoth.convertToHtml,render=html2canvas;
   mammoth.convertToHtml=async()=>({value:'<p>synthetic one</p><hr class="docx-pb"><p>synthetic two</p>'});
   let count=0;html2canvas=async()=>{if(++count===2)throw Error('Synthetic render failure');const c=document.createElement('canvas');c.width=20;c.height=20;return c;};
   try{await loadSourceFiles([new File(['synthetic'],'render.docx')]);}finally{mammoth.convertToHtml=convert;html2canvas=render;}
  });
  assert.ok(dialogs.pop().includes('preserved'));assert.deepEqual(await readState(),before);
  assert.equal(await page.locator('#docx-iframe-wrap').evaluate(el=>el.children.length),0);
  // An import in flight excludes another import and export; old state stays visible.
  await page.evaluate(()=>{
   window.oldAppendSource=appendSourcePDF;
   appendSourcePDF=async(...args)=>{window.enteredSource=true;await new Promise(r=>window.resumeSource=r);return window.oldAppendSource(...args);};
   window.pendingSource=loadSourceFiles([new File([new Uint8Array(sample)],'new.pdf')]);
  });
  await page.waitForFunction(()=>window.enteredSource);
  assert.deepEqual(await readState(),before);
  await page.evaluate(async()=>{await loadMainFile(new File([new Uint8Array(sample)],'ignored.pdf'));await saveAsPDF();window.resumeSource();await window.pendingSource;appendSourcePDF=window.oldAppendSource;});
  assert.equal(await page.evaluate(()=>state.mainFileName),'main.pdf');assert.equal(await page.evaluate(()=>state.sourceFileName),'new.pdf');
  // Capture every attempted download; mark the session dirty without changing content.
  await page.evaluate(()=>{snapshotForUndo();window.downloads=[];downloadDocument=(data,type,name)=>downloads.push({data:Array.from(data),type,name});window.oldAppend=appendPageToPdfDocument;window.oldSave=saveEditedPdf;});
  async function startGatedPDF(finalStage=false) {
   await page.evaluate(finalStage=>{
    window.enteredExport=false;
    if(finalStage)saveEditedPdf=async(...args)=>{const data=await window.oldSave(...args);window.enteredExport=true;await new Promise(r=>window.resumeExport=r);return data;};
    else appendPageToPdfDocument=async(...args)=>{window.enteredExport=true;await new Promise(r=>window.resumeExport=r);return window.oldAppend(...args);};
    window.pendingExport=saveAsPDF();
   },finalStage);
   await page.waitForFunction(()=>window.enteredExport);
  }
  for(const finalStage of [false,true]) {
   await startGatedPDF(finalStage);
   assert.equal(await page.locator('#main').getAttribute('aria-busy'),'true');
   assert.equal(await page.locator('#progress-bar-track').getAttribute('role'),'progressbar');
   if(finalStage)await page.keyboard.press('Escape');else await page.locator('#cancel-export').click();
   assert.match(await page.locator('#progress-text').innerText(),/Cancelling/);
   if(!finalStage){fs.mkdirSync(path.join(root,'test-results'),{recursive:true});await page.screenshot({path:path.join(root,'test-results/io-cancelling.png'),animations:'disabled'});}
   await page.evaluate(async()=>{window.resumeExport();await window.pendingExport;appendPageToPdfDocument=window.oldAppend;saveEditedPdf=window.oldSave;});
   assert.equal(await page.evaluate(()=>downloads.length),0);assert.equal(await page.evaluate(()=>hasUnexportedChanges()),true);
   assert.equal(await page.locator('#main').getAttribute('aria-busy'),'false');
   assert.match(await page.locator('#st-msg').innerText(),/Export cancelled/);
  }
  // ZIP cancellation via keyboard Enter; no partial ZIP is handed to browser.
  await page.evaluate(()=>{window.oldSingle=makeSinglePagePdf;window.enteredZip=false;makeSinglePagePdf=async(...args)=>{window.enteredZip=true;await new Promise(r=>window.resumeZip=r);return window.oldSingle(...args);};exportPagesAsZip();});
  await page.locator('#modal-ok').click();await page.waitForFunction(()=>window.enteredZip);
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'cancel-export');
  await page.keyboard.press('Enter');await page.evaluate(()=>window.resumeZip());
  await page.waitForFunction(()=>!documentIO.busy);
  assert.equal(await page.evaluate(()=>downloads.length),0);assert.equal(await page.evaluate(()=>hasUnexportedChanges()),true);
  await page.evaluate(()=>{makeSinglePagePdf=window.oldSingle;});
  // A new export clears the cancellation flag and succeeds after three cancelled runs.
  await page.evaluate(()=>saveAsPDF());
  const result=await page.evaluate(async()=>({count:downloads.length,pages:(await PDFLib.PDFDocument.load(new Uint8Array(downloads[0].data))).getPageCount(),dirty:hasUnexportedChanges(),name:downloads[0].name}));
  assert.deepEqual(result,{count:1,pages:4,dirty:false,name:'main_edited.pdf'});
  await page.evaluate(()=>exportPagesAsZip());await page.locator('#modal-ok').click();await page.waitForFunction(()=>!documentIO.busy&&downloads.length===2);
  assert.equal(await page.evaluate(()=>downloads[1].type),'application/zip');
  // Larger synthetic document: preservation of selectable text and ordered pages.
  const large=await page.evaluate(async()=>{const d=await PDFLib.PDFDocument.create();for(let i=0;i<120;i++)d.addPage([420,594]).drawText('STRESS '+i,{x:20,y:500});return Array.from(await d.save());});
  await page.locator('#file-main').setInputFiles({name:'synthetic-120.pdf',mimeType:'application/pdf',buffer:Buffer.from(large)});
  await page.waitForFunction(()=>!documentIO.busy&&state.mainPages.length===120);await page.evaluate(()=>saveAsPDF());
  const stress=await page.evaluate(async()=>{const pdf=await pdfjsLib.getDocument({data:new Uint8Array(downloads.at(-1).data)}).promise;const result={pages:pdf.numPages,first:(await(await pdf.getPage(1)).getTextContent()).items.map(i=>i.str).join(''),last:(await(await pdf.getPage(120)).getTextContent()).items.map(i=>i.str).join('')};await pdf.destroy();return result;});
  assert.deepEqual(stress,{pages:120,first:'STRESS 0',last:'STRESS 119'});
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);assert.deepEqual(dialogs,[]);
  console.log('PASS IO safety: atomic batches, invalid formats/images/DOCX, render cleanup, concurrency guard, PDF/ZIP cancellation and retry, accessible keyboard progress, 120-page text/order, offline.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
