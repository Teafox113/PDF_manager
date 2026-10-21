// Synthetic fixtures only; no user document reads or PDF downloads.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'version.json'))).version;
const asset=process.env.PDF_MANAGER_ASSET||path.join(root,`release-assets/pdf_editor_offline_v${version}.html`);
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 try{
  const page=await(await browser.newContext({offline:true,viewport:{width:1400,height:1000}})).newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await page.goto(pathToFileURL(asset).href);await page.locator('#language-select').selectOption('en');
  const bytes=await page.evaluate(async()=>{const d=await PDFLib.PDFDocument.create(),p=d.addPage([1000,1400]);p.drawRectangle({x:100,y:900,width:100,height:50,color:PDFLib.rgb(1,0,0)});d.addPage([500,700]).drawText('KEEP',{x:30,y:650});return Array.from(await d.save());});
  await page.locator('#file-main').setInputFiles({name:'synthetic-polish.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)});await page.waitForFunction(()=>!documentIO.busy&&state.mainPages.length===2);
  await page.locator('#left-thumbs .thumb-card').first().dblclick();await page.waitForFunction(()=>stampEditor.pageSize);
  await page.locator('#pe-page-crop').click();await page.waitForFunction(()=>pageGeometry?.ready);
  const setRect=()=>page.evaluate(()=>{pageGeometry.rect={x:50,y:100,width:500,height:500};writeGeometryRect();refreshGeometryPreview();});
  await setRect();await page.locator('#geo-drag-mode').selectOption('move');
  let b=await page.locator('#geo-preview').boundingBox();
  await page.mouse.move(b.x+b.width*.4,b.y+b.height*.4);await page.mouse.down();await page.mouse.move(b.x+b.width*.5,b.y+b.height*.5,{steps:3});await page.mouse.up();
  let rect=await page.evaluate(()=>pageGeometry.rect);assert.ok(Math.abs(rect.x-150)<1);assert.ok(Math.abs(rect.y-240)<1);assert.equal(rect.width,500);assert.equal(rect.height,500);
  const start={...rect};await page.locator('#geo-preview').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Shift+ArrowDown');await page.keyboard.press('Alt+ArrowLeft');
  rect=await page.evaluate(()=>pageGeometry.rect);assert.ok(Math.abs(rect.x-start.x-.9*72/25.4)<.0001);assert.ok(Math.abs(rect.y-start.y-10*72/25.4)<.0001);
  // Escape mid-drag restores the prior box and leaves the dialog open.
  const before=await page.evaluate(()=>({...pageGeometry.rect}));
  await page.mouse.move(b.x+b.width*.4,b.y+b.height*.4);await page.mouse.down();await page.mouse.move(b.x+b.width*.6,b.y+b.height*.6,{steps:3});await page.keyboard.press('Escape');await page.mouse.up();
  assert.deepEqual(await page.evaluate(()=>pageGeometry.rect),before);assert.equal(await page.locator('#page-geometry-overlay').isVisible(),true);
  // Pointer cancellation from touch/OS interruptions restores too.
  await page.mouse.move(b.x+b.width*.4,b.y+b.height*.4);await page.mouse.down();await page.mouse.move(b.x+b.width*.5,b.y+b.height*.5);await page.locator('#geo-preview').dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();assert.deepEqual(await page.evaluate(()=>pageGeometry.rect),before);
  await page.locator('#geo-reset').click();assert.deepEqual(await page.evaluate(()=>pageGeometry.rect),{x:0,y:0,width:1000,height:1400});assert.equal(await page.locator('#geo-drag-mode').inputValue(),'draw');
  await page.locator('#geo-w').fill('');assert.equal(await page.locator('#geo-w').getAttribute('aria-invalid'),'true');assert.match(await page.locator('#geo-error').innerText(),/valid numbers/);assert.ok(!(await page.locator('#geo-summary').innerText()).includes('NaN'));
  await page.locator('#geo-w').fill('100');await page.locator('#geo-x').fill('-2');assert.match(await page.locator('#geo-error').innerText(),/negative/);
  await page.locator('#geo-x').fill('999');assert.match(await page.locator('#geo-error').innerText(),/right or bottom/);assert.equal(await page.locator('#geo-apply').isDisabled(),true);
  await setRect();await page.locator('#geo-result').check();
  assert.equal(await page.locator('#geo-preview').getAttribute('data-mode'),'result');assert.match(await page.locator('#geo-resolution').innerText(),/298 dpi/);
  const exact=await page.evaluate(()=>({...pageGeometry.rect}));b=await page.locator('#geo-preview').boundingBox();await page.mouse.move(b.x+b.width*.2,b.y+b.height*.2);await page.mouse.down();await page.mouse.move(b.x+b.width*.7,b.y+b.height*.7);await page.mouse.up();assert.deepEqual(await page.evaluate(()=>pageGeometry.rect),exact);
  // Compare the output-preview red marker with the actual cropped page preview.
  await page.evaluate(()=>{window.redBox=canvas=>{const a=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let x0=canvas.width,y0=canvas.height,x1=-1,y1=-1;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const i=(y*canvas.width+x)*4;if(a[i]>200&&a[i+1]<50&&a[i+2]<50){x0=Math.min(x,x0);x1=Math.max(x,x1);y0=Math.min(y,y0);y1=Math.max(y,y1);}}return [x0/canvas.width,y0/canvas.height,(x1-x0+1)/canvas.width,(y1-y0+1)/canvas.height];};window.previewRed=redBox(geoEl('preview'));});
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});await page.screenshot({path:path.join(root,'test-results/geometry-result-polish.png'),animations:'disabled'});
  await page.evaluate(()=>{window.stages=[];window.realProgress=geometryProgress;geometryProgress=async(...args)=>{stages.push(args);await realProgress(...args);};});
  await page.locator('#geo-apply').click();await page.waitForFunction(()=>!documentIO.busy&&!pageGeometry);
  const result=await page.evaluate(async()=>{const c=document.createElement('canvas');await renderPagePreviewToCanvas(state.mainPages[0],c,680);return {actual:redBox(c),preview:previewRed,stages,undo:undoStack.length};});
  result.actual.forEach((v,i)=>assert.ok(Math.abs(v-result.preview[i])<.008,JSON.stringify(result)));assert.deepEqual(result.stages.map(s=>s[1]),[10,35,70]);assert.equal(result.undo,1);assert.equal(await page.locator('#progress-wrap').isVisible(),false);
  await page.locator('#pe-undo').click();
  // Failure unlocks UI, hides progress and retains both draft and document.
  await page.locator('#pe-page-crop').click();await page.waitForFunction(()=>pageGeometry?.ready);await setRect();
  await page.evaluate(()=>{window.realErase=erasePageArea;erasePageArea=async()=>{await geometryProgress('正在準備頁面',10);throw Error('Synthetic failure');};});
  await page.locator('#geo-apply').click();await page.waitForFunction(()=>!documentIO.busy&&geoEl('error').textContent);
  assert.equal(await page.evaluate(()=>undoStack.length),0);assert.deepEqual(await page.evaluate(()=>pageGeometry.rect),exact);assert.equal(await page.locator('#progress-wrap').isVisible(),false);assert.equal(await page.locator('#toolbar').evaluate(el=>el.inert),true);
  await page.evaluate(()=>{erasePageArea=window.realErase;});await page.locator('#geo-cancel').click();
  // A new open must clear the previous preview while it is loading, and a late
  // render finishing after cancel must not reopen or overwrite the next dialog.
  await page.evaluate(()=>{window.realRender=renderPagePreviewToCanvas;window.started=false;renderPagePreviewToCanvas=async(...args)=>{window.started=true;await new Promise(r=>window.resume=r);return realRender(...args);};window.opening=openPageGeometry('crop');});
  await page.waitForFunction(()=>window.started);assert.equal(await page.locator('#geo-preview').evaluate(c=>c.width),1);await page.locator('#geo-cancel').click();await page.evaluate(async()=>{window.resume();await opening;renderPagePreviewToCanvas=window.realRender;});assert.equal(await page.locator('#page-geometry-overlay').isVisible(),false);
  await page.locator('#stamp-toolbar button.success').click();await page.locator('#language-select').selectOption('zh-TW');await page.locator('#left-thumbs .thumb-card').first().dblclick();await page.waitForFunction(()=>stampEditor.pageSize);await page.locator('#pe-page-crop').click();await page.waitForFunction(()=>pageGeometry?.ready);
  assert.equal(await page.locator('#geo-reset').innerText(),'重設裁切框');await page.setViewportSize({width:600,height:800});await page.locator('#geo-cancel').scrollIntoViewIfNeeded();assert.equal(await page.locator('#geo-cancel').isVisible(),true);
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);console.log('PASS geometry polish: move/nudge/reset, escape/pointercancel rollback, result-preview/output pixels, field errors, progress success/failure, stale preview cancellation, bilingual/narrow layout, offline.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
