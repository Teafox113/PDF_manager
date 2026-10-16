// Synthetic, local-only regressions for project-owned resource pruning.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'))).version;
const asset=process.env.PDF_MANAGER_ASSET||path.join(root,`release-assets/pdf_editor_offline_v${version}.html`);
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const context=await browser.newContext({offline:true});const page=await context.newPage();const errors=[],network=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 await page.goto(pathToFileURL(asset).href);
 const lexical=await page.evaluate(()=>{
   const enc=new TextEncoder();const u=pdfContentUsage(enc.encode('% /Fake Do\nBT /F#31 12 Tf (/Ghost Do \\( nested \\)) Tj ET /Real#20Image Do'));
   const rejected=['BI /W 1 ID x EI','/X Do /Y','(unterminated','/Im#Z0 Do','<< /Key 1 0 R >> BDC','/Unknown foo'];
   return {fonts:[...u.Font],images:[...u.XObject],rejected:rejected.map(s=>{try{pdfContentUsage(enc.encode(s));return false;}catch{return true;}})};
 });
 assert.deepEqual(lexical,{fonts:['F1'],images:['Real Image'],rejected:Array(6).fill(true)});
 for(const mode of ['unused','visible','nested','annotation','inline']){
  const result=await page.evaluate(async mode=>{
   const L=PDFLib,N=L.PDFName.of,d=await L.PDFDocument.create(),a=d.addPage([400,400]),b=d.addPage([400,400]);
   a.drawText('ERASE_MARKER_482971',{x:20,y:300,size:16});a.drawText('BOTTOM_KEEP',{x:20,y:30,size:16});
   const c=document.createElement('canvas');c.width=32;c.height=32;const x=c.getContext('2d');x.fillStyle='#e814a1';x.fillRect(0,0,32,32);
   const img=await d.embedPng(c.toDataURL());a.drawImage(img,{x:20,y:220,width:40,height:40});
   b.node.set(N('Resources'),a.node.Resources());b.drawText('OTHER_PAGE_SEARCHABLE_7291',{x:20,y:100,size:16});
   if(mode==='visible')b.drawImage(img,{x:20,y:220,width:40,height:40});
   if(mode==='nested'){
     const resources=d.context.obj({XObject:{UnusedSecret:img.ref}});
     const form=d.context.register(d.context.flateStream('q 0 0 1 rg 100 200 30 30 re f Q',{Type:'XObject',Subtype:'Form',BBox:[0,0,400,400],Resources:resources}));
     b.node.Resources().lookup(N('XObject'),L.PDFDict).set(N('FormOne'),form);
     b.pushOperators(L.PDFOperator.of('Do',[N('FormOne')]));
   }
   if(mode==='annotation')b.node.set(N('Annots'),d.context.obj([d.context.register(d.context.obj({Type:'Annot',Subtype:'Text',Rect:[0,0,20,20],Contents:L.PDFString.of('ANNOTATION')}))]));
   if(mode==='inline')b.node.addContentStream(d.context.register(d.context.flateStream('BI /W 1 /H 1 /BPC 8 /CS /RGB ID abc EI')));
   const input=await d.save();state.mainPages=[0,1].map(index=>({id:uid(),sourceType:'main_pdf',pdfBytes:input,pageIndex:index}));state.selectedMain=new Set([0]);
   undoStack.length=0;await openStampEditor();const old=state.mainPages;
   let rejected=false;try{await erasePageArea(getActiveStampPage(),{x:0,y:0,width:390,height:200});}catch(e){rejected=!!e.pageEditMessage;}
   if(rejected){closeStampEditor();return {rejected,unchanged:state.mainPages===old,undo:undoStack.length};}
   const output=await L.PDFDocument.create(),cache=new Map();for(const p of state.mainPages)await appendPageToPdfDocument(output,p,cache);
   const bytes=await saveEditedPdf(output,state.mainPages),parsed=await L.PDFDocument.load(bytes);
   const secret='ERASE_MARKER_482971',hex=Array.from(secret,c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join('').toUpperCase();
   const leaked=parsed.context.enumerateIndirectObjects().some(([,obj])=>{if(!(obj instanceof L.PDFRawStream))return false;const s=new TextDecoder('latin1').decode(L.decodePDFRawStream(obj).decode());return s.includes(secret)||s.toUpperCase().includes(hex);});
   const images=parsed.context.enumerateIndirectObjects().filter(([,obj])=>obj.dict?.get(N('Subtype'))?.toString()==='/Image').map(([,obj])=>obj.dict.get(N('Width')).asNumber());
   const pdf=await pdfjsLib.getDocument({data:bytes.slice()}).promise;const texts=[],pictures=[];
   for(let n=1;n<=2;n++){const p=await pdf.getPage(n);texts.push((await p.getTextContent()).items.map(t=>t.str).join(' '));const vp=p.getViewport({scale:1}),cv=document.createElement('canvas');cv.width=vp.width;cv.height=vp.height;await p.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;pictures.push(cv.toDataURL().split(',')[1]);}
   await pdf.destroy();
   const single=await L.PDFDocument.load(await makeSinglePagePdf(state.mainPages[1],new Map()));
   const zipImages=single.context.enumerateIndirectObjects().filter(([,obj])=>obj.dict?.get(N('Subtype'))?.toString()==='/Image').length;
   // Reintroducing the old source image must be rejected on subsequent export.
   const reinsert=await L.PDFDocument.create();await appendPageToPdfDocument(reinsert,old[0],new Map());
   let reinsertionBlocked=false;try{await saveEditedPdf(reinsert,state.mainPages);}catch{reinsertionBlocked=true;}
   await undoPageEdit();const restored=state.mainPages[0].sourceType==='main_pdf'&&!state.mainPages.some(p=>p.requiresResourceCleanup);closeStampEditor();
   return {rejected,images,texts,zipImages,reinsertionBlocked,restored,pictures,leaked};
  },mode);
  if(['visible','annotation','inline'].includes(mode))assert.deepEqual(result,{rejected:true,unchanged:true,undo:0},mode);
  else {
   assert.equal(result.rejected,false,mode);assert.equal(result.images.length,1,mode);assert.ok(result.images[0]>1000);assert.equal(result.texts[0],'');assert.ok(result.texts[1].includes('OTHER_PAGE_SEARCHABLE_7291'));
   assert.equal(result.zipImages,0);assert.equal(result.reinsertionBlocked,true);assert.equal(result.restored,true);assert.equal(result.leaked,false);
   fs.mkdirSync(path.join(root,'test-results'),{recursive:true});result.pictures.forEach((p,i)=>fs.writeFileSync(path.join(root,`test-results/cleanup-${mode}-${i+1}.png`),Buffer.from(p,'base64')));
  }
  console.log('PASS cleanup:',mode);
 }
 for(const rotation of [0,90,180,270]){
  const geometry=await page.evaluate(async rotation=>{
   const d=await PDFLib.PDFDocument.create(),p=d.addPage([600,400]);p.setCropBox(30,20,540,340);p.setRotation(PDFLib.degrees(rotation));
   p.drawRectangle({x:80,y:80,width:60,height:40,color:PDFLib.rgb(0,0,1)});const bytes=await d.save();
   const pdf=await pdfjsLib.getDocument({data:bytes.slice()}).promise,pg=await pdf.getPage(1),vp=pg.getViewport({scale:1});
   const r=vp.convertToViewportRectangle([80,80,140,120]);const rect={x:Math.min(r[0],r[2])-2,y:Math.min(r[1],r[3])-2,width:Math.abs(r[2]-r[0])+4,height:Math.abs(r[3]-r[1])+4};await pdf.destroy();
   state.mainPages=[{id:uid(),sourceType:'main_pdf',pdfBytes:bytes,pageIndex:0}];state.selectedMain=new Set([0]);await openStampEditor();await erasePageArea(getActiveStampPage(),rect);
   const out=await PDFLib.PDFDocument.create();await appendPageToPdfDocument(out,getActiveStampPage(),new Map());const exported=await saveEditedPdf(out,state.mainPages);
   const cv=document.createElement('canvas');await renderPdfPageToCanvasAtWidth(exported,0,cv,vp.width);const data=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
   let blue=0;for(let i=0;i<data.length;i+=4)if(data[i]<50&&data[i+1]<50&&data[i+2]>200)blue++;
   closeStampEditor();return {size:out.getPage(0).getSize(),blue};
  },rotation);
  assert.equal(geometry.blue,0);assert.deepEqual(geometry.size,rotation%180?{width:340,height:540}:{width:540,height:340});console.log('PASS erase rotation/crop:',rotation);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);console.log('PASS lexer, unused/shared/nested resources, retained text, atomic refusal, ZIP, reinsert protection, undo, rotated crop erasure, offline.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
