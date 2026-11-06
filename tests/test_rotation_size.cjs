// Synthetic fixtures only. PDF and ZIP bytes stay in memory; no user files.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'version.json'))).version;
const asset=process.env.PDF_MANAGER_ASSET||path.join(root,`release-assets/pdf_editor_offline_v${version}.html`);
const close=(actual,expected,label)=>{assert.equal(actual.length,expected.length,label);actual.forEach((n,i)=>assert.ok(Math.abs(n-expected[i])<0.01,`${label}: ${actual} != ${expected}`));};
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 try{
  const page=await(await browser.newContext({offline:true})).newPage(),errors=[],requests=[],dialogs=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});
  await page.goto(pathToFileURL(asset).href);await page.evaluate(()=>pdfManagerEngineReady);
  // Establish test helpers in the actual offline app, without replacing export logic.
  await page.evaluate(()=>{
   window.rotationFixture=async(rotation=0,crop=false,unit=1)=>{
    const L=PDFLib,d=await L.PDFDocument.create(),p=d.addPage([210*72/25.4,297*72/25.4]);
    p.drawText('SYNTHETIC ROTATION',{x:50,y:600});p.setRotation(L.degrees(rotation));
    if(crop)p.setCropBox(20,30,400,600);
    p.node.set(L.PDFName.of('UserUnit'),L.PDFNumber.of(unit));
    d.addPage([300,450]).drawText('UNTOUCHED',{x:20,y:400});
    const bytes=await d.save();
    state.mainPages=[0,1].map(i=>({id:uid(),sourceType:'pdf',pdfBytes:bytes,pageIndex:i,stamps:[],origin:'main'}));
    state.mainFileName='synthetic-rotation.pdf';state.selectedMain.clear();undoStack.length=0;redoStack.length=0;
    resetThumbRendering();renderMainThumbs();updateMainHeader();updateToolbar();
   };
   window.rotationSizes=async bytes=>{
    const d=await PDFLib.PDFDocument.load(bytes),sizes=[];
    for(const p of d.getPages()){
     const b=p.getCropBox(),unit=p.node.get(PDFLib.PDFName.of('UserUnit'))?.asNumber()||1;
     sizes.push((Math.abs(p.getRotation().angle)%180===90?[b.height,b.width]:[b.width,b.height]).map(n=>n*unit));
    }
    return sizes;
   };
   window.rotationSingleSize=async()=> (await rotationSizes(await makeSinglePagePdf(state.mainPages[0],new Map())))[0];
  });
  for(const rotation of [0,90,180,270])for(const crop of [false,true])for(const unit of [1,2]){
   const result=await page.evaluate(async({rotation,crop,unit})=>{
    await rotationFixture(rotation,crop,unit);const initial=await rotationSingleSize(),steps=[];
    for(let i=0;i<4;i++){await rotatePage(0,'cw');steps.push(await rotationSingleSize());}
    await rotatePage(0,'ccw');const ccw=await rotationSingleSize();undo();const undone=await rotationSingleSize();redo();const redone=await rotationSingleSize();
    const d=await PDFLib.PDFDocument.create(),cache=new Map();for(const p of state.mainPages)await appendPageToPdfDocument(d,p,cache);
    const full=await rotationSizes(await saveEditedPdf(d,state.mainPages));
    return {initial,steps,ccw,undone,redone,full};
   },{rotation,crop,unit});
   const flipped=[result.initial[1],result.initial[0]];
   result.steps.forEach((size,i)=>close(size,i%2===0?flipped:result.initial,`CW ${rotation}/${crop}/${unit}/${i}`));
   close(result.ccw,flipped,'CCW');close(result.undone,result.initial,'undo');close(result.redone,flipped,'redo');
   close(result.full[0],flipped,'full PDF');close(result.full[1],[300,450],'untouched page');
  }
  // Existing raster pages retain explicit dimensions, or the pre-rotation legacy size.
  for(const explicit of [false,true]){
   const r=await page.evaluate(async explicit=>{
    const c=document.createElement('canvas');c.width=160;c.height=90;c.getContext('2d').fillRect(0,0,160,90);
    state.mainPages=[{id:uid(),sourceType:'image',imageDataUrl:c.toDataURL(),stamps:[],...(explicit?{pageSize:{width:210,height:297}}:{})}];
    const before=await rotationSingleSize();await rotatePage(0,'ccw');return {before,after:await rotationSingleSize()};
   },explicit);close(r.after,[r.before[1],r.before[0]],'image rotation');
  }
  // Rendering failure must not modify page dimensions or consume an undo step.
  const failure=await page.evaluate(async()=>{
   await rotationFixture();const p=state.mainPages[0],old=rotateDataUrl;
   rotateDataUrl=async()=>{throw new Error('synthetic failure');};let rejected=false;
   try{await rotatePage(0,'cw');}catch{rejected=true;}finally{rotateDataUrl=old;}
   return {rejected,source:p.sourceType,hasSize:!!p.pageSize,undo:undoStack.length};
  });assert.deepEqual(failure,{rejected:true,source:'pdf',hasSize:false,undo:0});
  // Exercise the real PDF/ZIP UI flow; intercept only the final download boundary.
  await page.evaluate(async()=>{
   await rotationFixture();await rotatePage(0,'cw');window.rotationDownloads=[];
   downloadDocument=(bytes,type,name)=>rotationDownloads.push({bytes:Array.from(bytes),type,name});await saveAsPDF();exportPagesAsZip();
  });
  await page.locator('#modal-ok').click();await page.waitForFunction(()=>!documentIO.busy&&rotationDownloads.length===2);
  const downloads=await page.evaluate(()=>rotationDownloads);
  assert.equal(downloads[0].type,'application/pdf');assert.equal(downloads[1].type,'application/zip');
  const pdfSizes=await page.evaluate(d=>rotationSizes(new Uint8Array(d)),downloads[0].bytes);
  close(pdfSizes[0],[297*72/25.4,210*72/25.4],'A4 full export');
  const zip=Buffer.from(downloads[1].bytes),entries=[];let offset=0;
  while(zip.readUInt32LE(offset)===0x04034b50){
   assert.equal(zip.readUInt16LE(offset+8),0);const size=zip.readUInt32LE(offset+18),n=zip.readUInt16LE(offset+26),extra=zip.readUInt16LE(offset+28),start=offset+30+n+extra;
   entries.push(Array.from(zip.subarray(start,start+size)));offset=start+size;
  }
  assert.equal(entries.length,2);
  for(let i=0;i<entries.length;i++){
   const sizes=await page.evaluate(d=>rotationSizes(new Uint8Array(d)),entries[i]);assert.equal(sizes.length,1);
   close(sizes[0],i===0?[297*72/25.4,210*72/25.4]:[300,450],'ZIP page');
  }
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);assert.deepEqual(dialogs,[]);
  console.log('PASS rotation physical size: 16 rotation/CropBox/UserUnit cases, repeated CW/CCW, undo/redo, images, failure atomicity, full PDF and actual ZIP flow, offline.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
