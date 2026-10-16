// Synthetic regressions only. No private filenames, document text or URLs.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'version.json'))).version;
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const ctx=await b.newContext({offline:true}),p=await ctx.newPage();let http=0;p.on('request',r=>{if(/^https?:/.test(r.url()))http++;});
 await p.goto(pathToFileURL(process.env.PDF_MANAGER_ASSET||path.join(root,`release-assets/pdf_editor_offline_v${version}.html`)).href);
 for(const mode of ['ordinary','javascript','next-action','appearance','text-annotation','named-destination','inline']){
 const result=await p.evaluate(async mode=>{
  const L=PDFLib,N=L.PDFName.of,d=await L.PDFDocument.create();const a=d.addPage([300,300]),b=d.addPage([300,300]);
  a.drawText('REMOVED_PRIVATE_SYNTHETIC',{x:10,y:250,size:10});b.drawText('KEEP_SEARCHABLE',{x:10,y:150,size:10});
  const internal={Type:'Annot',Subtype:'Link',Rect:[10,10,60,30],F:4,Border:[0,0,0],Dest:[a.ref,'XYZ',null,null,null]};
  const external={Type:'Annot',Subtype:'Link',Rect:[10,40,60,60],BS:{W:0},A:{S:'URI',URI:L.PDFString.of('https://example.invalid/local-only')}};
  if(mode==='javascript')external.A={S:'JavaScript',JS:L.PDFString.of('forbidden')};
  if(mode==='next-action')external.A.Next=d.context.obj({S:'JavaScript',JS:L.PDFString.of('forbidden')});
  if(mode==='appearance')external.AP=d.context.obj({N:d.context.register(d.context.flateStream('q Q'))});
  if(mode==='text-annotation')external.Subtype='Text';
  if(mode==='named-destination')internal.Dest=L.PDFString.of('unresolved');
  b.node.set(N('Annots'),d.context.obj([d.context.register(d.context.obj(internal)),d.context.register(d.context.obj(external))]));
  if(mode==='inline')b.node.addContentStream(d.context.register(d.context.flateStream('BI /W 1 /H 1 /BPC 8 /CS /RGB ID abc EI')));
  const bytes=await d.save();state.mainPages=[0,1].map(pageIndex=>({id:uid(),sourceType:'main_pdf',pdfBytes:bytes,pageIndex}));state.selectedMain=new Set([0]);undoStack.length=0;await openStampEditor();const old=state.mainPages;
  try{await erasePageArea(getActiveStampPage(),{x:0,y:0,width:300,height:90});}
  catch(e){closeStampEditor();const code=e.pdfCleanReason,page=e.pdfCleanPage,message=e.pageEditMessage;I18N.setLanguage('en');const english=pdfCleanError(code,page).pageEditMessage;I18N.setLanguage('zh-TW');return {rejected:true,code,page,message,english,unchanged:state.mainPages===old,undo:undoStack.length};}
  const out=await L.PDFDocument.create(),cache=new Map();for(const pg of state.mainPages)await appendPageToPdfDocument(out,pg,cache);const exported=await saveEditedPdf(out,state.mainPages),parsed=await L.PDFDocument.load(exported);
  const ann=parsed.getPage(1).node.lookup(N('Annots'),L.PDFArray),target=parsed.context.lookup(ann.get(0)).lookup(N('Dest'),L.PDFArray).get(0);
  const sourceLeaks=parsed.context.enumerateIndirectObjects().some(([,obj])=>{if(!(obj instanceof L.PDFRawStream))return false;const s=new TextDecoder('latin1').decode(L.decodePDFRawStream(obj).decode());return s.includes('REMOVED_PRIVATE_SYNTHETIC')||s.toUpperCase().includes(Array.from('REMOVED_PRIVATE_SYNTHETIC',c=>c.charCodeAt(0).toString(16)).join('').toUpperCase());});
  const zip=await L.PDFDocument.load(await makeSinglePagePdf(state.mainPages[1],new Map()));
  const zipLinks=zip.getPage(0).node.lookup(N('Annots'),L.PDFArray).size();
  closeStampEditor();return {rejected:false,links:ann.size(),targetIsReplacement:target.toString()===parsed.getPage(0).ref.toString(),sourceLeaks,zipLinks,originalLinkCount:d.getPage(1).node.lookup(N('Annots'),L.PDFArray).size()};
 },mode);
 if(mode==='ordinary')assert.deepEqual(result,{rejected:false,links:2,targetIsReplacement:true,sourceLeaks:false,zipLinks:1,originalLinkCount:2});
 else {assert.equal(result.rejected,true);assert.equal(result.page,2);assert.equal(result.unchanged,true);assert.equal(result.undo,0);assert.ok(result.message.includes('第 2 頁'));assert.ok(result.english.includes('page 2'));assert.equal(result.code,{'text-annotation':'annotation','named-destination':'link_target',inline:'inline'}[mode]||'link_action');}
 console.log('PASS links:',mode);
 }
 assert.equal(http,0);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
