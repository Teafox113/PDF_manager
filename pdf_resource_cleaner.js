/* Project-owned implementation based on PDF 32000-1 sections 7.3, 7.8 and 8.
 * No MuPDF/PDFium implementation code is incorporated. Uses existing pdf-lib.
 * Deliberately conservative: unsupported constructs fail closed, never guess.
 * This is resource pruning for page replacement, NOT a general PDF redactor.
 */
'use strict';
const PDF_CLEAN_LIMITS = { bytes: 40000000, stream: 8000000, tokens: 1000000, objects: 100000, depth: 64 };
function pdfCleanError(reason='structure',page=null) {
  const e = new Error('PDF resource cleanup: unsupported or unsafe structure');
  const reasons={structure:['不支援的 PDF 結構','Unsupported PDF structure'],syntax:['不支援或損壞的內容語法','Unsupported or malformed content syntax'],inline:['內嵌圖片（BI）尚未支援','Inline images (BI) are not supported'],size:['超過安全處理大小限制','Safety size limit exceeded'],annotation:['含非普通超連結的註解','Contains annotations other than ordinary links'],link_action:['超連結含不支援的動作或外觀','Link contains an unsupported action or appearance'],link_target:['超連結目的地無法安全解析','Link destination cannot be resolved safely'],AcroForm:['含互動表單','Contains an interactive form'],Perms:['含簽章或權限結構','Contains signature or permission structures'],Collection:['含文件集合','Contains a document collection'],OCProperties:['含圖層','Contains optional-content layers'],font:['不支援的字型類型','Unsupported font type'],resources:['不支援的圖樣、著色或具名屬性','Unsupported pattern, shading or named property'],mask:['不支援的圖形軟遮罩','Unsupported graphics soft mask'],shared_image:['仍使用消去來源的共用圖片','Still uses an original image from the erased page'],parse:['PDF 解析失敗或文件受加密保護','PDF parsing failed or document is encrypted']};
  Object.assign(reasons,{fields:['頁面或 Form 含尚未支援的額外欄位','Page or Form contains unsupported extra fields'],missing_resource:['缺少繪圖指令所需的資源','A drawing resource is missing'],cycle:['資源循環參照或巢狀層數過深','Cyclic resources or excessive nesting'],external:['含尚未支援的附加資料或外部參照欄位','Unsupported auxiliary data or external-reference fields'],object:['不支援的繪圖物件類型','Unsupported drawing object type']});
  const en=document.documentElement.lang==='en',text=(reasons[reason]||reasons.structure)[en?1:0];
  e.pdfCleanReason=reason;e.pdfCleanPage=page;
  e.pageEditMessage=(page?(en?`Main PDF page ${page}: `:`主 PDF 第 ${page} 頁：`):(en?'Document: ':'文件：'))+text+(en?'. Erasure/export was not applied.':'。未套用消去／輸出。');
  return e;
}
function pdfCleanAt(error,page){return pdfCleanError(error.pdfCleanReason||'structure',error.pdfCleanPage??page);}
const pdfOutputLinks=new WeakMap();
const pdfLinkSources=new WeakMap();
function pdfLinkIdentity(pg){
  if(pg.linkSourceIdentity)return pg.linkSourceIdentity;
  if(!pg.pdfBytes)return null;
  if(!pdfLinkSources.has(pg.pdfBytes))pdfLinkSources.set(pg.pdfBytes,uid());
  return {key:pdfLinkSources.get(pg.pdfBytes),index:pg.pageIndex};
}
// Extract only inert, explicitly supported link data; never copy annotation
// page pointers or arbitrary action dictionaries into a new document.
function readOrdinaryLinks(doc,node,pageNumber){
  const L=PDFLib,N=L.PDFName.of,ctx=doc.context,links=[];
  const resolve=o=>o instanceof L.PDFRef?ctx.lookup(o):o;
  const arr=node.lookupMaybe(N('Annots'),L.PDFArray);if(!arr)return links;
  const number=o=>{o=resolve(o);if(!(o instanceof L.PDFNumber)||!Number.isFinite(o.asNumber()))throw pdfCleanError('link_action',pageNumber);return o.asNumber();};
  const numbers=(o,min,max)=>{o=resolve(o);if(!(o instanceof L.PDFArray)||o.size()<min||o.size()>max)throw pdfCleanError('link_action',pageNumber);return o.asArray().map(number);};
  const literal=o=>{o=resolve(o);if(!(o instanceof L.PDFString||o instanceof L.PDFHexString))throw pdfCleanError('link_action',pageNumber);return o.decodeText();};
  for(const ref of arr.asArray()){
    const a=resolve(ref);if(!(a instanceof L.PDFDict)||a.get(N('Subtype'))?.toString()!=='/Link')throw pdfCleanError('annotation',pageNumber);
    const allowed=new Set('Type Subtype Rect Border C H BS F QuadPoints StructParent P Dest A'.split(' '));
    if(a.keys().some(k=>!allowed.has(k.decodeText())))throw pdfCleanError('link_action',pageNumber);
    const link={rect:numbers(a.get(N('Rect')),4,4),style:{}};
    for(const key of ['C','QuadPoints'])if(a.has(N(key)))link.style[key]=numbers(a.get(N(key)),0,1024);
    if(a.has(N('F')))link.style.F=number(a.get(N('F')));
    if(a.has(N('H'))){const h=a.get(N('H'))?.toString();if(!['/N','/I','/O','/P'].includes(h))throw pdfCleanError('link_action',pageNumber);link.style.H=h.slice(1);}
    if(a.has(N('Border'))){const b=resolve(a.get(N('Border')));if(!(b instanceof L.PDFArray)||![3,4].includes(b.size()))throw pdfCleanError('link_action',pageNumber);link.style.Border=b.asArray().map((v,i)=>i===3?numbers(v,0,100):number(v));}
    if(a.has(N('BS'))){const bs=resolve(a.get(N('BS')));if(!(bs instanceof L.PDFDict)||bs.keys().some(k=>!['Type','W','S','D'].includes(k.decodeText())))throw pdfCleanError('link_action',pageNumber);link.style.BS={};if(bs.has(N('W')))link.style.BS.W=number(bs.get(N('W')));if(bs.has(N('D')))link.style.BS.D=numbers(bs.get(N('D')),0,100);if(bs.has(N('S'))){const s=bs.get(N('S'))?.toString();if(!['/S','/D','/B','/I','/U'].includes(s))throw pdfCleanError('link_action',pageNumber);link.style.BS.S=s.slice(1);}}
    let dest=a.get(N('Dest'));
    if(a.has(N('A'))){
      if(dest)throw pdfCleanError('link_action',pageNumber);
      const action=resolve(a.get(N('A')));if(!(action instanceof L.PDFDict))throw pdfCleanError('link_action',pageNumber);
      const type=action.get(N('S'))?.toString();
      if(type==='/URI'){
        if(action.keys().some(k=>!['Type','S','URI'].includes(k.decodeText())))throw pdfCleanError('link_action',pageNumber);
        const uri=literal(action.get(N('URI')));if(!/^(https?:\/\/|mailto:)/i.test(uri)||/[\x00-\x20\x7f]/.test(uri)||uri.length>8192)throw pdfCleanError('link_action',pageNumber);
        link.uri=uri;
      }else if(type==='/GoTo'&&action.keys().every(k=>['Type','S','D'].includes(k.decodeText())))dest=action.get(N('D'));
      else throw pdfCleanError('link_action',pageNumber);
    }
    if(dest){
      dest=resolve(dest);if(!(dest instanceof L.PDFArray))throw pdfCleanError('link_target',pageNumber);
      const target=dest.get(0);link.targetIndex=doc.getPages().findIndex(p=>p.ref.toString()===target?.toString());
      const kind=dest.get(1)?.toString(),lengths={'/XYZ':5,'/Fit':2,'/FitH':3,'/FitV':3,'/FitR':6,'/FitB':2,'/FitBH':3,'/FitBV':3};
      if(link.targetIndex<0||dest.size()!==lengths[kind])throw pdfCleanError('link_target',pageNumber);
      link.destination=[kind.slice(1),...dest.asArray().slice(2).map(v=>v===L.PDFNull?null:number(v))];
    }else if(!link.uri)throw pdfCleanError('link_target',pageNumber);
    links.push(link);
  }return links;
}
function recordOutputLinks(doc,page,pg,links){
  let records=pdfOutputLinks.get(doc);if(!records){records=[];pdfOutputLinks.set(doc,records);}records.push({page,pg,links,identity:pdfLinkIdentity(pg)});
}
function rebuildOutputLinks(doc){
  const L=PDFLib,N=L.PDFName.of,records=pdfOutputLinks.get(doc);if(!records)return;
  for(const {page,pg,links,identity} of records){
    const annotations=[];
    for(const link of links){
      const obj={Type:'Annot',Subtype:'Link',Rect:link.rect,...link.style};
      if(link.uri)obj.A={S:'URI',URI:L.PDFString.of(link.uri)};
      else {const target=records.find(r=>r.identity?.key===identity?.key&&r.identity?.index===link.targetIndex);
        // A removed/absent destination (including per-page ZIP) must never pull
        // an off-tree source page and its original streams into the output.
        if(!target)continue;obj.Dest=[target.page.ref,...((target.pg.rasterized||target.pg.geometryChanged)?['Fit']:link.destination)];
      }
      annotations.push(doc.context.register(doc.context.obj(obj)));
    }
    if(annotations.length)page.node.set(N('Annots'),doc.context.obj(annotations));else page.node.delete(N('Annots'));
  }
}
function pdfContentUsage(bytes) {
  if(bytes.length>PDF_CLEAN_LIMITS.stream)throw pdfCleanError('size');
  let i=0,count=0;
  const ws=c=>c===0||c===9||c===10||c===12||c===13||c===32;
  const delim=c=>ws(c)||[40,41,60,62,91,93,123,125,47,37].includes(c);
  const ascii=(a,b)=>{let s='';for(let j=a;j<b;j++)s+=String.fromCharCode(bytes[j]);return s;};
  function skip(){while(i<bytes.length){if(ws(bytes[i])){i++;continue;}if(bytes[i]===37){while(i<bytes.length&&bytes[i]!==10&&bytes[i]!==13)i++;continue;}break;}}
  function token(depth=0){
    if(++count>PDF_CLEAN_LIMITS.tokens||depth>PDF_CLEAN_LIMITS.depth)throw pdfCleanError();
    skip();if(i>=bytes.length)return null;
    const c=bytes[i++];
    if(c===47){const a=i;while(i<bytes.length&&!delim(bytes[i]))i++;const raw=ascii(a,i);if(/#(?![0-9a-fA-F]{2})/.test(raw))throw pdfCleanError();return {type:'name',value:raw.replace(/#([0-9a-fA-F]{2})/g,(_,h)=>String.fromCharCode(parseInt(h,16)))};}
    if(c===40){let n=1;while(i<bytes.length&&n){const x=bytes[i++];if(x===92){if(i<bytes.length)i++;}else if(x===40)n++;else if(x===41)n--;}if(n)throw pdfCleanError();return {type:'string'};}
    if(c===60&&bytes[i]!==60){let closed=false;while(i<bytes.length){const x=bytes[i++];if(x===62){closed=true;break;}if(!ws(x)&&!/[0-9a-fA-F]/.test(String.fromCharCode(x)))throw pdfCleanError();}if(!closed)throw pdfCleanError();return {type:'string'};}
    if(c===91||(c===60&&bytes[i]===60)){
      const dict=c===60;if(dict)i++;let n=0;
      while(true){skip();if(i>=bytes.length)throw pdfCleanError();if((!dict&&bytes[i]===93)||(dict&&bytes[i]===62&&bytes[i+1]===62)){i+=dict?2:1;break;}
        const t=token(depth+1);if(t.type==='word'||(dict&&n%2===0&&t.type!=='name'))throw pdfCleanError();n++;
      }if(dict&&n%2)throw pdfCleanError();return {type:dict?'dict':'array'};
    }
    if(delim(c))throw pdfCleanError();
    const a=i-1;while(i<bytes.length&&!delim(bytes[i]))i++;const value=ascii(a,i);
    if(/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(value))return {type:'number',value:Number(value)};
    if(['true','false','null'].includes(value))return {type:'literal'};
    return {type:'word',value};
  }
  const used=Object.fromEntries(['Font','XObject','ExtGState','ColorSpace','Pattern','Shading','Properties'].map(k=>[k,new Set()]));
  const known=new Set('q Q cm w J j M d ri i m l c v y h re S s f F f* B B* b b* n W W* BT ET Tc Tw Tz TL Tr Ts Td TD Tm T* Tj TJ \' " d0 d1 G g RG rg K k CS cs SC SCN sc scn Do Tf gs sh MP DP BMC BDC EMC BX EX'.split(' '));
  let args=[];
  const name=(group,index)=>{if(args[index]?.type!=='name')throw pdfCleanError();used[group].add(args[index].value);};
  for(let t;(t=token());){
    if(t.type!=='word'){args.push(t);if(args.length>10000)throw pdfCleanError();continue;}
    const op=t.value;if(!known.has(op))throw pdfCleanError(op==='BI'?'inline':'syntax');
    if(op==='Do'){if(args.length!==1)throw pdfCleanError();name('XObject',0);}
    if(op==='Tf'){if(args.length!==2||args[1].type!=='number')throw pdfCleanError();name('Font',0);}
    if(op==='gs'){if(args.length!==1)throw pdfCleanError();name('ExtGState',0);}
    if(op==='CS'||op==='cs'){if(args.length!==1)throw pdfCleanError();name('ColorSpace',0);}
    if(op==='SCN'||op==='scn'){if(args.at(-1)?.type==='name')name('Pattern',args.length-1);}
    if(op==='sh')name('Shading',0);
    if(op==='BDC'||op==='DP'){if(args.length!==2)throw pdfCleanError();if(args[1].type==='name')name('Properties',1);else if(args[1].type!=='dict')throw pdfCleanError();}
    args=[];
  }
  if(args.length)throw pdfCleanError();return used;
}
async function pdfImageFingerprints(doc) {
  const hashes=[];
  for(const [,obj] of doc.context.enumerateIndirectObjects()){
    if(obj instanceof PDFLib.PDFRawStream&&obj.dict.get(PDFLib.PDFName.of('Subtype'))?.toString()==='/Image'){
      // Raw streams are retained byte-for-byte by pdf-lib copying. Hash all image
      // streams, including masks and unused entries: conservative conflict check.
      const digest=await crypto.subtle.digest('SHA-256',obj.contents);
      hashes.push(Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join(''));
    }
  }return hashes;
}
async function assertErasureSources(pages) {
  const cache=new Map();
  for(const [pageIndex,pg] of pages.entries()){
    const inputs=[...(pg.pdfBytes?[{bytes:pg.pdfBytes,index:pg.pageIndex}]:[]),...(pg.stamps||[]).filter(s=>s.pdfBytes).map(s=>({bytes:s.pdfBytes,index:s.pageIndex}))];
    for(const input of inputs){
      try{
        if(input.bytes.byteLength>PDF_CLEAN_LIMITS.bytes)throw pdfCleanError('size');
        let doc=cache.get(input.bytes);if(!doc){try{doc=await PDFLib.PDFDocument.load(input.bytes,{updateMetadata:false});}catch{throw pdfCleanError('parse');}cache.set(input.bytes,doc);}
        for(const key of ['AcroForm','Perms','Collection','OCProperties'])if(doc.catalog.has(PDFLib.PDFName.of(key)))throw pdfCleanError(key);
        readOrdinaryLinks(doc,doc.getPage(input.index).node,pageIndex+1);
      }catch(e){throw pdfCleanAt(e,pageIndex+1);}
    }
  }
}
async function cleanPdfResources(bytes, forbiddenHashes=[],pageLabels=[]) {
  if(bytes.length>PDF_CLEAN_LIMITS.bytes)throw pdfCleanError('size');
  const L=PDFLib,N=L.PDFName.of,doc=await L.PDFDocument.load(bytes,{updateMetadata:false}),ctx=doc.context;
  const lookup=o=>o instanceof L.PDFRef?ctx.lookup(o):o;
  const visitedForms=new Set(),visitingForms=new Set();let decodedTotal=0;
  function dict(o){o=lookup(o);if(!(o instanceof L.PDFDict))throw pdfCleanError();return o;}
  function keysWithin(d,names){const allowed=new Set(names.split(' '));if(d.keys().some(k=>!allowed.has(k.decodeText())))throw pdfCleanError('fields');}
  function decode(o){o=lookup(o);if(!(o instanceof L.PDFRawStream))throw pdfCleanError('syntax');const data=L.decodePDFRawStream(o).decode();decodedTotal+=data.length;if(decodedTotal>PDF_CLEAN_LIMITS.bytes)throw pdfCleanError('size');return data;}
  function usage(content){
    const a=lookup(content);const chunks=a instanceof L.PDFArray?a.asArray().map(decode):content?[decode(content)]:[];
    const len=chunks.reduce((s,c)=>s+c.length+1,0);if(len>PDF_CLEAN_LIMITS.stream)throw pdfCleanError('size');
    const joined=new Uint8Array(len);let off=0;for(const chunk of chunks){joined.set(chunk,off);off+=chunk.length;joined[off++]=10;}try{return pdfContentUsage(joined);}catch(e){throw e.pdfCleanReason==='structure'?pdfCleanError('syntax'):e;}
  }
  function font(o){const f=dict(o);if(!['/Type0','/Type1','/MMType1','/TrueType','/CIDFontType0','/CIDFontType2'].includes(f.get(N('Subtype'))?.toString()))throw pdfCleanError('font');}
  function form(o,depth){
    if(depth>PDF_CLEAN_LIMITS.depth||visitingForms.has(o))throw pdfCleanError('cycle');if(visitedForms.has(o))return;
    visitingForms.add(o);
    keysWithin(o.dict,'Type Subtype FormType BBox Matrix Resources Group Length Filter DecodeParms Name StructParent StructParents');
    if(!o.dict.has(N('Resources')))throw pdfCleanError('missing_resource');
    const resources=prune(o.dict.get(N('Resources')),usage(o),depth+1);o.dict.set(N('Resources'),resources);
    visitingForms.delete(o);visitedForms.add(o);
  }
  function prune(resources,used,depth){
    const old=resources?dict(resources):ctx.obj({}),fresh=ctx.obj({});
    if(used.Pattern.size||used.Shading.size||used.Properties.size)throw pdfCleanError('resources');
    // Defaults can alter Device* colour interpretation even without a cs/CS op.
    const colors=old.lookupMaybe(N('ColorSpace'),L.PDFDict);
    for(const key of ['DefaultGray','DefaultRGB','DefaultCMYK'])if(colors?.has(N(key)))used.ColorSpace.add(key);
    for(const [group,names] of Object.entries(used)){
      const entries=ctx.obj({});const source=old.lookupMaybe(N(group),L.PDFDict);
      for(const name of names){
        if(group==='ColorSpace'&&['DeviceGray','DeviceRGB','DeviceCMYK','Pattern'].includes(name))continue;
        const ref=source?.get(N(name));if(!ref)throw pdfCleanError('missing_resource');const obj=lookup(ref);
        if(group==='Font')font(obj);
        if(group==='XObject'){
          if(!(obj instanceof L.PDFRawStream))throw pdfCleanError('object');const type=obj.dict.get(N('Subtype'))?.toString();
          if(type==='/Form')form(obj,depth);else if(type!=='/Image')throw pdfCleanError('object');
        }
        if(group==='ExtGState'){
          const gs=dict(obj),mask=gs.get(N('SMask'));if(mask&&mask.toString()!=='/None')throw pdfCleanError('mask');
          const f=gs.lookupMaybe(N('Font'),L.PDFArray);if(f)font(f.get(0));
        }
        entries.set(N(name),ref);
      }if(entries.keys().length)fresh.set(N(group),entries);
    }return fresh;
  }
  const safeLinkDicts=new Set(),pageNumbers=new Map(),imageOwners=new Map();
  for(const [i,page] of doc.getPages().entries()){
    const label=pageLabels[i]||i+1;pageNumbers.set(page.node,label);
    try{
    keysWithin(page.node,'Type Parent Resources MediaBox CropBox BleedBox TrimBox ArtBox Rotate UserUnit Contents Annots Group StructParents Tabs');
    readOrdinaryLinks(doc,page.node,label);
    const a=page.node.lookupMaybe(N('Annots'),L.PDFArray);
    for(const ref of a?.asArray()||[])safeLinkDicts.add(lookup(ref));
    page.node.set(N('Resources'),prune(page.node.Resources(),usage(page.node.get(N('Contents'))),0));
    }catch(e){throw pdfCleanAt(e,label);}
  }
  // Walk only the freshly built output catalogue. Remove unreachable copied
  // streams and Info rather than carrying old revisions into the saved file.
  const reachable=new Set(),objects=new Set();
  const banned=new Set(['Metadata','PieceInfo','OPI','Alternates','Ref','AF','Thumb','AA','A','EmbeddedFiles','AcroForm','Perms','OC','OCProperties','F','FFilter','FDecodeParms']);
  function walk(obj,depth=0,page=null){
    if(depth>PDF_CLEAN_LIMITS.depth)throw pdfCleanError('cycle',page);
    if(obj instanceof L.PDFRef){const id=obj.toString();if(reachable.has(id))return;reachable.add(id);if(reachable.size>PDF_CLEAN_LIMITS.objects)throw pdfCleanError();obj=lookup(obj);if(!obj)throw pdfCleanError();}
    if(pageNumbers.has(obj))page=pageNumbers.get(obj);
    if(objects.has(obj))return;objects.add(obj);
    if(obj instanceof L.PDFRawStream){if(obj.dict.get(N('Subtype'))?.toString()==='/Image')imageOwners.set(obj,page);walk(obj.dict,depth+1,page);}
    else if(obj instanceof L.PDFDict){for(const [key,val] of obj.entries()){if(banned.has(key.decodeText())&&!(safeLinkDicts.has(obj)&&['A','F'].includes(key.decodeText())))throw pdfCleanError('external',page);walk(val,depth+1,page);}}
    else if(obj instanceof L.PDFArray){for(const val of obj.asArray())walk(val,depth+1,page);}
  }
  walk(ctx.trailerInfo.Root);
  for(const [ref] of ctx.enumerateIndirectObjects())if(!reachable.has(ref.toString()))ctx.delete(ref);
  ctx.trailerInfo.Info=undefined;ctx.trailerInfo.ID=undefined;
  const blocked=new Set(forbiddenHashes);
  if(blocked.size)for(const [obj,page] of imageOwners){const digest=await crypto.subtle.digest('SHA-256',obj.contents);const h=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');if(blocked.has(h))throw pdfCleanError('shared_image',page);}
  return doc.save({useObjectStreams:false,addDefaultPage:false,updateFieldAppearances:false});
}
async function saveEditedPdf(doc,pages,outputPages=pages) {
  rebuildOutputLinks(doc);
  const bytes=await doc.save();
  if(!pages.some(pg=>pg.requiresResourceCleanup))return bytes;
  try{return await cleanPdfResources(bytes,pages.flatMap(pg=>pg.erasureImageHashes||[]),outputPages.map(pg=>pages.findIndex(p=>p.id===pg.id)+1));}
  catch(e){throw e.pdfCleanReason?e:pdfCleanError('parse');}
}
