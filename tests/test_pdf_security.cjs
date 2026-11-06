// Synthetic bytes only; no user files, exploit payloads, or persisted PDF outputs.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'version.json'))).version;
const asset=process.env.PDF_MANAGER_ASSET||path.join(root,`release-assets/pdf_editor_offline_v${version}.html`);
const guard=fs.readFileSync(path.join(root,'pdf_security.js'),'utf8');
const source=fs.readFileSync(path.join(root,'pdf_editor.html'),'utf8');
// Check production call sites, not third-party code or test-only parser calls.
for(const file of ['pdf_editor.html','page_editor.js','page_geometry.js','pdf_resource_cleaner.js']){
 const code=fs.readFileSync(path.join(root,file),'utf8');assert.ok(!/pdfjsLib\s*\.\s*getDocument\s*\(/.test(code),`${file} bypasses the safety gateway`);
}
assert.equal((source.match(/loadLocalPdf\(/g)||[]).length,8);
const calls=[],sandbox={Uint8Array,ArrayBuffer,pdfjsLib:{getDocument:o=>{calls.push(o);return {promise:Promise.resolve()};}}};
vm.createContext(sandbox);vm.runInContext(guard,sandbox);
for(const data of [new Uint8Array([1,2]),new ArrayBuffer(3)]){
 sandbox.loadLocalPdf(data,{isEvalSupported:true,enableXfa:true});const opts=calls.at(-1);
 assert.equal(opts.data,data);assert.equal(opts.isEvalSupported,false);assert.equal(opts.enableXfa,false);assert.equal('url' in opts,false);
}
for(const input of ['https://example.invalid/document.pdf',{data:new Uint8Array([1]),isEvalSupported:true},null])assert.throws(()=>sandbox.loadLocalPdf(input),/local bytes/);
const html=fs.readFileSync(asset,'utf8'),csp=html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)[1];
assert.ok(!csp.includes("'unsafe-eval'"));assert.ok(csp.includes("connect-src 'none'"));
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 try{
  const page=await(await browser.newContext({offline:true})).newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await page.goto(pathToFileURL(asset).href);await page.evaluate(()=>pdfManagerEngineReady);
  // Run from a real DOM click: DevTools evaluation can bypass CSP for debugging.
  await page.addScriptTag({content:`document.body.insertAdjacentHTML('beforeend','<button id="security-probe">Security test</button>');document.getElementById('security-probe').addEventListener('click',()=>(${(async()=>{
   // Confirm both the page and an inherited-CSP Blob worker reject code evaluation.
   let pageBlocked=false;try{new Function('return 1')();}catch(e){pageBlocked=e.name==='EvalError';}
   const workerBlocked=await new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(new Blob(["try { new Function('return 1')(); postMessage(false); } catch(e) { postMessage(e.name === 'EvalError'); }"],{type:'application/javascript'}));
    const w=new Worker(url),timer=setTimeout(()=>{w.terminate();URL.revokeObjectURL(url);reject(Error('Worker probe timeout'));},10000);
    w.onmessage=e=>{clearTimeout(timer);w.terminate();URL.revokeObjectURL(url);resolve(e.data);};
    w.onerror=()=>{clearTimeout(timer);w.terminate();URL.revokeObjectURL(url);reject(Error('Worker probe failed'));};
   });
   let loaded=false,rendered=false;
    const d=await PDFLib.PDFDocument.create();d.addPage([300,400]).drawText('SYNTHETIC SECURITY TEST',{x:20,y:300});
    const doc=await loadLocalPdf(await d.save()).promise;
    try{const p=await doc.getPage(1),v=p.getViewport({scale:1}),c=document.createElement('canvas');c.width=v.width;c.height=v.height;
     await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;rendered=true;loaded=(await p.getTextContent()).items.some(x=>x.str.includes('SYNTHETIC'));}
    finally{await doc.loadingTask.destroy();}
   return {pageBlocked,workerBlocked,loaded,rendered};
  }).toString()})().then(value=>window.securityProbeResult=value).catch(error=>window.securityProbeResult={error:error.message}));`});
  await page.locator('#security-probe').click();await page.waitForFunction(()=>window.securityProbeResult);
  const probe=await page.evaluate(()=>window.securityProbeResult);
  assert.equal(probe.pageBlocked,true,JSON.stringify(probe));assert.equal(probe.workerBlocked,true);assert.equal(probe.loaded,true);assert.equal(probe.rendered,true);
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  console.log('PASS PDF security: all production entry points gated, option override/URL rejected, gateway passes eval=false, page/worker CSP rejects Function, synthetic render/text works offline.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
