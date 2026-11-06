// Real engine, thread, codecs and resource loading; all PDFs are synthesized.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'version.json'))).version;
const asset=process.env.PDF_MANAGER_ASSET||path.join(root,`release-assets/pdf_editor_offline_v${version}.html`);
const fixtures=JSON.parse(execFileSync(process.env.PYTHON||'python',[path.join(__dirname,'make_engine_fixtures.py')],{encoding:'utf8'}));
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 try {
  const page=await(await browser.newContext({offline:true})).newPage(),errors=[],requests=[],warnings=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  page.on('console',m=>{if(/Warning:|fake worker|Unable to load|ICCBased color space:|getWasmInstance|not found/.test(m.text()))warnings.push(m.text());});
  await page.goto(pathToFileURL(asset).href);await page.evaluate(()=>pdfManagerEngineReady);await page.evaluate(()=>pdfManagerEngineReady);
  assert.equal(await page.evaluate(()=>pdfjsLib.version),'6.5.438');
  const result=await page.evaluate(async({jpx,icc})=>{
   const L=PDFLib,N=L.PDFName.of,bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
   const d=await L.PDFDocument.create();
   const p=d.addPage([300,400]);p.drawText('OFFLINE STANDARD FONT',{x:20,y:300,size:12});
   const cid=d.context.register(d.context.obj({Type:'Font',Subtype:'CIDFontType0',BaseFont:'STSong-Light',
    CIDSystemInfo:{Registry:L.PDFString.of('Adobe'),Ordering:L.PDFString.of('GB1'),Supplement:0},DW:1000}));
   const font=d.context.register(d.context.obj({Type:'Font',Subtype:'Type0',BaseFont:'STSong-Light',Encoding:'UniGB-UCS2-H',DescendantFonts:[cid]}));
   p.node.Resources().lookup(N('Font')).set(N('CJK'),font);
   p.node.addContentStream(d.context.register(d.context.flateStream('BT /CJK 18 Tf 20 250 Td <4e2d6587> Tj ET')));
   const img=d.context.register(d.context.stream(bytes(jpx),{Type:'XObject',Subtype:'Image',Width:16,Height:16,BitsPerComponent:8,ColorSpace:'DeviceRGB',Filter:'JPXDecode'}));
   p.node.Resources().set(N('XObject'),d.context.obj({JPX:img}));
   p.node.addContentStream(d.context.register(d.context.flateStream('q 64 0 0 64 20 100 cm /JPX Do Q')));
   const profile=d.context.register(d.context.stream(bytes(icc),{N:4,Alternate:'DeviceCMYK'}));
   p.node.Resources().set(N('ColorSpace'),d.context.obj({ICC:['ICCBased',profile]}));
   p.node.addContentStream(d.context.register(d.context.flateStream('q /ICC cs 1 0 0 0 scn 120 100 64 64 re f Q')));
   // PDF actions must remain inert (no viewer scripting manager/QuickJS shipped).
   d.catalog.set(N('OpenAction'),d.context.obj({S:'JavaScript',JS:L.PDFString.of('globalThis.PDF_SCRIPT_RAN=true')}));
   const task=loadLocalPdf(await d.save()),doc=await task.promise;
   const realWorker=doc.loadingTask.pdfManagerWorker.port instanceof Worker;
   const pg=await doc.getPage(1),v=pg.getViewport({scale:1}),canvas=document.createElement('canvas');
   canvas.width=v.width;canvas.height=v.height;
   await pg.render({canvasContext:canvas.getContext('2d'),viewport:v}).promise;
   const text=(await pg.getTextContent()).items.map(x=>x.str).join(' ');
   const ctx=canvas.getContext('2d'),red=Array.from(ctx.getImageData(40,260,1,1).data),cyan=Array.from(ctx.getImageData(140,260,1,1).data);
   const cjkPixels=ctx.getImageData(20,130,60,25).data;
   let cjkInk=0;for(let i=0;i<cjkPixels.length;i+=4)if(cjkPixels[i]<150&&cjkPixels[i+1]<150&&cjkPixels[i+2]<150)cjkInk++;
   await doc.loadingTask.destroy();
   return {realWorker,text,red,cyan,cjkInk,scriptRan:!!globalThis.PDF_SCRIPT_RAN};
  },fixtures);
  assert.equal(result.realWorker,true,JSON.stringify({result,errors,warnings,requests}));assert.match(result.text,/OFFLINE STANDARD FONT/);assert.match(result.text,/中文/);
  assert.ok(result.red[0]>200&&result.red[1]<50&&result.red[2]<60,JSON.stringify(result));
  assert.ok(result.cjkInk>30,'CJK glyphs must paint, not just extract text');
  assert.ok(result.cyan[0]<100&&result.cyan[1]>100&&result.cyan[2]>100,JSON.stringify(result));assert.equal(result.scriptRan,false);
  // Verify all shipped WASM modules compile, including the JBIG2 decoder.
  const waiting=page.waitForEvent('worker');
  await page.evaluate(()=>{window.engineProbeWorker=new Worker(pdfManagerWorkerSource);});
  const worker=await waiting;
  await worker.evaluate(async()=>{
   for(const name of ['openjpeg.wasm','jbig2.wasm','qcms_bg.wasm'])
    await WebAssembly.compile(pdfManagerResourceBytes('pdf-manager-resource:///wasm/'+name));
   let blocked=false;try{await fetch('https://example.invalid/forbidden');}catch{blocked=true;}
   if(!blocked)throw Error('Worker allowed an external resource');
  });
  await page.evaluate(()=>engineProbeWorker.terminate());
  assert.deepEqual(warnings,[],'Valid resource fixtures must not warn or use fallback');
  await page.evaluate(async()=>{
   let rejected=false;
   try{await loadLocalPdf(new TextEncoder().encode('not a PDF')).promise;}catch{rejected=true;}
   if(!rejected)throw Error('Invalid PDF was accepted');
  });
  for(let i=0;i<50&&page.workers().length;i++)await page.waitForTimeout(100);
  assert.equal(page.workers().length,0,'Workers must close after documents/errors');
  await page.waitForTimeout(200);assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  assert.deepEqual(warnings,['Warning: Indexing all PDF objects'],'Only the deliberately invalid PDF may warn');
  console.log('PASS PDF.js 6.5.438: real Worker, offline CJK CMaps/standard fonts, JPX WASM pixels, ICC color, inert PDF action, no HTTP/fallback/resource warnings.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
