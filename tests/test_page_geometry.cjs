// Generated fixtures only. No user files, network or persisted PDF outputs.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'version.json'))).version;
const asset=process.env.PDF_MANAGER_ASSET||path.join(root,`release-assets/pdf_editor_offline_v${version}.html`);
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 try{
 const context=await browser.newContext({offline:true,viewport:{width:1440,height:1000}}),page=await context.newPage();const errors=[],requests=[],dialogs=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});
 await page.goto(pathToFileURL(asset).href);await page.locator('#language-select').selectOption('en');
 async function fixture(rotation=0,crop=false){
  const data=await page.evaluate(async({rotation,crop})=>{const d=await PDFLib.PDFDocument.create();
   const p=d.addPage([1000,1400]);p.drawText('OUTSIDE_PRIVATE_SYNTHETIC',{x:10,y:1380,size:10});p.drawText('INSIDE_VECTOR',{x:160,y:540,size:18});
   p.drawRectangle({x:150,y:400,width:160,height:80,color:PDFLib.rgb(1,0,0)});p.setRotation(PDFLib.degrees(rotation));if(crop)p.setCropBox(50,30,800,1200);
   d.addPage([300,500]).drawText('UNTOUCHED',{x:20,y:450});d.addPage([500,500]);d.addPage([210*PAGE_MM,297*PAGE_MM]).drawText('REFERENCE',{x:20,y:700});return Array.from(await d.save());},{rotation,crop});
  await page.locator('#file-main').setInputFiles({name:'synthetic-layout.pdf',mimeType:'application/pdf',buffer:Buffer.from(data)});
  if(await page.locator('#modal-overlay').isVisible())await page.locator('#modal-ok').click();
  await page.waitForFunction(()=>!documentIO.busy&&state.mainPages.length===4);
  await page.locator('#left-thumbs .thumb-card').first().dblclick();await page.waitForFunction(()=>stampEditor.pageSize);
 }
 async function exportText(){return page.evaluate(async()=>{const d=await PDFLib.PDFDocument.create(),cache=new Map();for(const p of state.mainPages)await appendPageToPdfDocument(d,p,cache);const bytes=await saveEditedPdf(d,state.mainPages);const pdf=await pdfjsLib.getDocument({data:bytes}).promise;const result=[];for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i);result.push({text:(await p.getTextContent()).items.map(t=>t.str).join(' '),size:[p.getViewport({scale:1}).width,p.getViewport({scale:1}).height]});}await pdf.destroy();return result;});}
 // Vector fitting across all rotations and CropBox offsets. Measure coloured
 // pixels against original display space to catch inverse-matrix errors.
 for(const rotation of [0,90,180,270])for(const crop of [false,true]){
  await fixture(rotation,crop);
  const result=await page.evaluate(async()=>{
   const pg=state.mainPages[0],ref=state.mainPages[3],before=state.mainPages.slice(),size=await getPageNaturalSize(pg),target=await getPageNaturalSize(ref);
   async function redBounds(p){const c=document.createElement('canvas');await renderPagePreviewToCanvas(p,c,600);const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let x0=c.width,y0=c.height,x1=-1,y1=-1;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4;if(a[i]>200&&a[i+1]<50&&a[i+2]<50){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}}return {x:x0/600,y:y0/600,w:(x1-x0+1)/600,h:(y1-y0+1)/600};}
   const b=await redBounds(pg);await fitPageToReference(pg,ref);const a=await redBounds(state.mainPages[0]),k=Math.min(target.width/size.width,target.height/size.height);
   return {b,a,expected:{x:((target.width-size.width*k)/2+b.x*size.width*k)/target.width,y:((target.height-size.height*k)/2+b.y*size.width*k)/target.width,w:b.w*size.width*k/target.width,h:b.h*size.width*k/target.width},stamps:state.mainPages[0].stamps.length,others:state.mainPages.slice(1).every((p,i)=>p.pdfBytes===before[i+1].pdfBytes&&p.pageIndex===before[i+1].pageIndex),size:await getPageNaturalSize(state.mainPages[0]),target};
  });
  for(const key of ['x','y','w','h'])assert.ok(Math.abs(result.a[key]-result.expected[key])<.006,JSON.stringify({rotation,crop,result,key}));
  assert.deepEqual(result.size,result.target);assert.equal(result.others,true);
  const output=await exportText();assert.ok(output[0].text.includes('INSIDE_VECTOR'));assert.ok(output[1].text.includes('UNTOUCHED'));assert.ok(output[3].text.includes('REFERENCE'));
  await page.locator('#pe-undo').click();assert.equal(await page.evaluate(()=>state.mainPages[0].geometryChanged||false),false);
  await page.locator('#pe-redo').click();assert.equal(await page.evaluate(()=>state.mainPages[0].geometryChanged),true);
  await page.locator('#stamp-toolbar button.success').click();
  console.log('PASS fit',rotation,crop);
 }
 await fixture();
 // Dialog cancellation, fixed physical paper, orientation and no-op.
 await page.locator('#pe-page-crop').click();await page.waitForFunction(()=>pageGeometry?.ready);
 await page.locator('#geo-apply').click();await page.waitForFunction(()=>!pageGeometry);assert.equal(await page.evaluate(()=>undoStack.length),0);
 await page.locator('#pe-page-crop').click();await page.waitForFunction(()=>pageGeometry?.ready);
 await page.locator('#geo-preset').selectOption('b4jis');assert.equal(await page.locator('#geo-w').inputValue(),'257.00');assert.equal(await page.locator('#geo-h').inputValue(),'364.00');
 await page.locator('#geo-landscape').check();assert.equal(await page.locator('#geo-w').inputValue(),'364.00');assert.equal(await page.locator('#geo-apply').isDisabled(),true);
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>undoStack.length),0);
 await page.locator('#pe-page-crop').click();await page.waitForFunction(()=>pageGeometry?.ready);
 await page.locator('#geo-preset').selectOption('a4');
 const beforeRect=await page.evaluate(()=>({...pageGeometry.rect})),box=await page.locator('#geo-preview').boundingBox();
 await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.53,box.y+box.height*.52,{steps:3});await page.mouse.up();
 assert.ok(await page.evaluate(x=>pageGeometry.rect.x>x,beforeRect.x));
 fs.mkdirSync(path.join(root,'test-results'),{recursive:true});await page.screenshot({path:path.join(root,'test-results/page-crop-preview.png'),animations:'disabled'});
 await page.locator('#geo-apply').click();await page.waitForFunction(()=>!documentIO.busy&&!pageGeometry);
 const cropped=await exportText();assert.equal(cropped[0].text,'');assert.ok(cropped[1].text.includes('UNTOUCHED'));assert.ok(Math.abs(cropped[0].size[0]-210*72/25.4)<1e-6);assert.ok(Math.abs(cropped[0].size[1]-297*72/25.4)<1e-6);
 assert.equal(await page.evaluate(()=>!!state.mainPages[0].pdfBytes),false);
 await page.locator('#pe-undo').click();assert.equal(await page.evaluate(()=>!!state.mainPages[0].pdfBytes),true);
 // Custom rectangle pointer path, negative/blank fields rejected, narrow viewport.
 await page.locator('#pe-page-crop').click();await page.waitForFunction(()=>pageGeometry?.ready);await page.setViewportSize({width:900,height:700});
 const custom=await page.locator('#geo-preview').boundingBox();await page.mouse.move(custom.x+custom.width*.15,custom.y+custom.height*.2);await page.mouse.down();await page.mouse.move(custom.x+custom.width*.75,custom.y+custom.height*.8,{steps:5});await page.mouse.up();
 const rect=await page.evaluate(()=>pageGeometry.rect);assert.ok(Math.abs(rect.width-600)<1);assert.ok(Math.abs(rect.height-840)<1);
 await page.locator('#geo-x').fill('-1');assert.equal(await page.locator('#geo-apply').isDisabled(),true);await page.locator('#geo-x').fill('');assert.equal(await page.locator('#geo-apply').isDisabled(),true);
 await page.locator('#geo-cancel').click();await page.setViewportSize({width:1440,height:1000});
 // UI reference uses page 4, not its source-file index; preview and apply.
 await page.locator('#pe-page-fit').click();await page.waitForFunction(()=>pageGeometry?.target);await page.locator('#geo-reference').selectOption({value:'3'});await page.waitForFunction(()=>pageGeometry?.reference===state.mainPages[3]);
 await page.screenshot({path:path.join(root,'test-results/page-fit-preview.png'),animations:'disabled'});
 await page.locator('#geo-apply').click();await page.waitForFunction(()=>!documentIO.busy&&!pageGeometry);assert.ok((await exportText())[0].text.includes('INSIDE_VECTOR'));
 // Safe crop refusal (shared original image) is atomic and stays in dialog.
 await page.locator('#pe-undo').click();
 await page.evaluate(async()=>{const c=document.createElement('canvas');c.width=20;c.height=10;const x=c.getContext('2d');x.fillStyle='blue';x.fillRect(0,0,20,10);const d=await PDFLib.PDFDocument.create(),im=await d.embedPng(c.toDataURL());for(let i=0;i<2;i++)d.addPage([600,850]).drawImage(im,{x:20,y:20,width:200,height:100});window.shared=Array.from(await d.save());});
 await page.locator('#stamp-toolbar button.success').click();const shared=await page.evaluate(()=>window.shared);
 await page.locator('#file-main').setInputFiles({name:'shared.pdf',mimeType:'application/pdf',buffer:Buffer.from(shared)});if(await page.locator('#modal-overlay').isVisible())await page.locator('#modal-ok').click();await page.waitForFunction(()=>!documentIO.busy&&state.mainPages.length===2);
 await page.locator('#left-thumbs .thumb-card').first().dblclick();await page.waitForFunction(()=>stampEditor.pageSize);await page.locator('#pe-page-crop').click();await page.waitForFunction(()=>pageGeometry?.ready);
 await page.locator('#geo-w').fill('100');await page.locator('#geo-h').fill('100');await page.locator('#geo-apply').click();await page.waitForFunction(()=>!documentIO.busy&&document.getElementById('geo-error').textContent);
 assert.equal(await page.evaluate(()=>undoStack.length),0);assert.equal(await page.evaluate(()=>!!state.mainPages[0].pdfBytes),true);assert.match(await page.locator('#geo-error').innerText(),/original image/);
 await page.locator('#geo-cancel').click();await page.locator('#stamp-toolbar button.success').click();
 // Internal links to the resized page must point to the new page, never an
 // off-tree copy of the old page. Added stamps are flattened; ZIP still works.
 const integrity=await page.evaluate(async()=>{
  const L=PDFLib,N=L.PDFName.of,d=await L.PDFDocument.create();const p=d.addPage([600,900]);p.drawText('FIT_TEXT',{x:80,y:800});const ref=d.addPage([300,300]);ref.drawText('REFERENCE_KEEP',{x:20,y:250});const linking=d.addPage([400,500]);linking.drawText('LINK_KEEP',{x:20,y:450});
  p.node.set(N('Annots'),d.context.obj([d.context.register(d.context.obj({Type:'Annot',Subtype:'Link',Rect:[10,10,80,30],A:{S:'URI',URI:L.PDFString.of('https://example.invalid')}}))]));
  linking.node.set(N('Annots'),d.context.obj([d.context.register(d.context.obj({Type:'Annot',Subtype:'Link',Rect:[10,10,80,30],Dest:[p.ref,'XYZ',10,800,null]}))]));
  await loadMainFile(new File([await d.save()],'links.pdf'),true);state.selectedMain.add(0);await openStampEditor();
  const c=document.createElement('canvas');c.width=40;c.height=20;c.getContext('2d').fillRect(0,0,40,20);
  state.mainPages[0].stamps=[{id:uid(),type:'image',imageDataUrl:c.toDataURL(),naturalW:40,naturalH:20,x:100,y:100,width:40,height:20,crop:{l:0,t:0,r:0,b:0}}];
  await fitPageToReference(state.mainPages[0],state.mainPages[1]);
  const out=await L.PDFDocument.create(),cache=new Map();for(const pg of state.mainPages)await appendPageToPdfDocument(out,pg,cache);const bytes=await saveEditedPdf(out,state.mainPages),loaded=await L.PDFDocument.load(bytes);
  const annot=loaded.context.lookup(loaded.getPage(2).node.lookup(N('Annots')).get(0)),dest=annot.lookup(N('Dest'));
  const result={dest:dest.get(0).toString()===loaded.getPage(0).ref.toString(),kind:dest.get(1).toString(),targetLinks:loaded.getPage(0).node.has(N('Annots')),offtree:loaded.context.enumerateIndirectObjects().filter(([,o])=>o instanceof L.PDFDict&&o.get(N('Type'))?.toString()==='/Page').length,
   stamps:state.mainPages[0].stamps.length,zipSize:(await L.PDFDocument.load(await makeSinglePagePdf(state.mainPages[0],new Map()))).getPage(0).getSize()};
  await undoPageEdit();result.undoStamp=state.mainPages[0].stamps.length;
  // Image pages retain their aspect ratio and physical page size on fit.
  state.mainPages[0]={id:uid(),sourceType:'image',imageDataUrl:c.toDataURL(),pageSize:{width:400,height:200},pageIndex:0,stamps:[]};await renderStampEditor();
  await fitPageToReference(state.mainPages[0],state.mainPages[1]);result.imageSize=await getPageNaturalSize(state.mainPages[0]);
  return result;
 });
 assert.deepEqual(integrity,{dest:true,kind:'/Fit',targetLinks:false,offtree:3,stamps:0,zipSize:{width:300,height:300},undoStamp:1,imageSize:{width:300,height:300}});
 // Single-page documents have no valid reference; blank source pages can fit.
 const blank=await page.evaluate(async()=>{closeStampEditor();const d=await PDFLib.PDFDocument.create();d.addPage([400,500]);await loadMainFile(new File([await d.save()],'blank.pdf'),true);state.selectedMain.add(0);await openStampEditor();await openPageGeometry('fit');return geoEl('apply').disabled;});
 assert.equal(blank,true);await page.locator('#geo-cancel').click();
 const blankSize=await page.evaluate(async()=>{const d=await PDFLib.PDFDocument.create();d.addPage([200,200]);const bytes=await d.save();state.mainPages.push({id:uid(),sourceType:'main_pdf',pdfBytes:bytes,pageIndex:0});await fitPageToReference(state.mainPages[0],state.mainPages[1]);return getPageNaturalSize(state.mainPages[0]);});
 assert.deepEqual(blankSize,{width:200,height:200});
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);assert.deepEqual(dialogs,[]);
 console.log('PASS crop presets/pointer/mm/no-op/cancel/refusal, vector fit rotations/CropBox/text/geometry/undo/redo, reference UI, offline.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
