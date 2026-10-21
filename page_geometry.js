/* Project-owned page crop and proportional fit. No network or persistence. */
'use strict';
const PAGE_MM=72/25.4;
let pageGeometry=null;
Object.assign(PAGE_EDIT_TEXT,{
  '裁切頁面':'Crop page','符合參考頁尺寸':'Fit to reference page',
  '自訂框選':'Custom rectangle','橫向':'Landscape','參考頁碼':'Reference page',
  '左距 mm':'Left mm','上距 mm':'Top mm','寬 mm':'Width mm','高 mm':'Height mm',
  '置中裁切框':'Center crop box','套用頁面尺寸':'Apply page size',
  '選「畫新框」重新框選，選「移動框」平移；固定紙張只能移動。也可輸入毫米數值。':'Choose Draw a new box to replace the selection, or Move box to reposition it. Fixed paper boxes can only move. Millimetre inputs are also available.',
  '裁切只重建本頁為圖片，框外不保留；本頁文字失去搜尋能力，新增物件定稿，連結移除。其他頁不轉圖片。不是全文件個資清理。':'Only this page is rebuilt as an image; the outside area is discarded. Text loses searchability, added objects are flattened and links removed. Other pages are not rasterized. This is not document-wide sanitization.',
  '等比例縮放並置中補白，不拉伸、不裁掉內容。保留原 PDF 文字／向量；本頁新增物件定稿，連結移除。參考頁不變。':'Scale proportionally and center with margins; no stretching or clipping. Original PDF text/vectors are preserved; added objects are flattened and links removed on this page. The reference page is unchanged.',
  '尺寸需大於零，且裁切框必須在頁面內；固定紙張太大時請改用參考頁校正。':'Dimensions must be positive and the crop must fit inside the page. If the paper preset is larger, use reference-page fitting instead.',
  '請選擇同份文件的另一頁':'Choose another page in the same document',
  '尺寸未變更':'Page size unchanged','頁面尺寸已更新，可復原':'Page size updated; undo is available',
  '套用前請確認預覽與影響說明；可在本次工作階段復原。':'Review the preview and effects before applying; session undo is available.',
  '裁切與參考頁等比例校正。':'Page cropping and proportional fitting to a reference page.',
  '裁切結果預覽、移動框、鍵盤微調與即時輸入診斷。':'Crop-result preview, move mode, keyboard nudging and live input validation.',
  '重設裁切框':'Reset crop box','畫新框':'Draw a new box','移動框':'Move box',
  '顯示裁切結果':'Show cropped result',
  '方向鍵移動 1 mm；Shift 為 10 mm，Alt 為 0.1 mm。結果預覽模式不能拖曳。':'Arrow keys move 1 mm; Shift moves 10 mm, Alt moves 0.1 mm. Dragging is disabled in result preview.',
  '請輸入有效數字':'Enter valid numbers','左距及上距不能小於零':'Left and top must not be negative',
  '寬高至少為 0.1 mm':'Width and height must be at least 0.1 mm',
  '裁切框超出頁面右側或下側':'The crop extends beyond the right or bottom edge',
  '正在準備頁面':'Preparing page','正在重建裁切區域':'Rebuilding cropped area',
  '正在校正尺寸':'Fitting page size','正在檢查完整輸出':'Validating complete output',
  '輸出預覽':'Output preview','裁切選框':'Crop selection','估計輸出解析度':'Estimated output sampling resolution',
  '取消本次拖曳':'Drag cancelled',
});
const geometryStyle=document.createElement('style');
geometryStyle.textContent=`
#page-geometry-overlay[hidden]{display:none}
#page-geometry-dialog [hidden]{display:none!important}
#page-geometry-overlay{position:fixed;inset:0;z-index:240;background:#000b;display:flex;align-items:center;justify-content:center;padding:12px}
#page-geometry-dialog{background:var(--ui-panel);color:var(--ui-text);border:1px solid var(--ui-border);border-radius:14px;padding:18px;width:min(1050px,96vw);max-height:90vh;overflow:auto}
#page-geometry-dialog h2{font-size:18px;margin:0 0 12px}
#page-geometry-dialog .geo-layout{display:grid;grid-template-columns:minmax(210px,300px) minmax(0,1fr);gap:18px}
#page-geometry-dialog label{display:block;margin:8px 0;font-size:13px}
#page-geometry-dialog input[type=number]{width:100%;padding:7px;box-sizing:border-box}
#page-geometry-dialog select{width:100%;padding:7px}
#page-geometry-dialog p{font-size:13px;line-height:1.6;margin:10px 0;overflow-wrap:anywhere}
#geo-fields{display:grid;grid-template-columns:1fr 1fr;gap:0 10px}
#geo-preview{display:block;max-width:100%;max-height:60vh;object-fit:contain;touch-action:none;cursor:crosshair;box-shadow:0 1px 8px #0006;margin:auto}
#geo-preview:focus-visible{outline:3px solid var(--ui-accent,#007ac2);outline-offset:4px}
#geo-preview[data-mode=move]{cursor:move}#geo-preview[data-mode=result]{cursor:default}
#page-geometry-dialog input[aria-invalid=true]{outline:2px solid var(--ui-danger,#e54b4b)}
#geo-preview-area{background:var(--ui-bg);padding:12px;display:flex;align-items:center;justify-content:center;min-height:180px}
#geo-error{color:var(--ui-danger,#ff726f)}
#page-geometry-dialog .geo-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:14px}
@media(max-width:700px){#page-geometry-dialog .geo-layout{grid-template-columns:1fr}#geo-preview{max-height:40vh}}
`;
document.head.append(geometryStyle);
const geometryOverlay=document.createElement('div');geometryOverlay.id='page-geometry-overlay';geometryOverlay.hidden=true;
geometryOverlay.setAttribute('role','dialog');geometryOverlay.setAttribute('aria-modal','true');geometryOverlay.setAttribute('aria-labelledby','geo-title');
geometryOverlay.innerHTML=`<div id="page-geometry-dialog">
 <h2 id="geo-title"></h2><div class="geo-layout"><div>
 <div id="geo-crop-controls">
 <select id="geo-preset" aria-label="Paper preset / 紙張規格"><option value="custom" data-pe-text="自訂框選">自訂框選</option><option value="a4">A4 · 210 × 297 mm</option><option value="b4jis">B4 (JIS) · 257 × 364 mm</option><option value="b4iso">B4 (ISO) · 250 × 353 mm</option></select>
 <label><input id="geo-landscape" type="checkbox"><span data-pe-text="橫向">橫向</span></label>
 <div id="geo-fields">
 <label><span data-pe-text="左距 mm">左距 mm</span><input id="geo-x" type="number" min="0" step="0.01"></label>
 <label><span data-pe-text="上距 mm">上距 mm</span><input id="geo-y" type="number" min="0" step="0.01"></label>
 <label><span data-pe-text="寬 mm">寬 mm</span><input id="geo-w" type="number" min="0.1" step="0.01"></label>
 <label><span data-pe-text="高 mm">高 mm</span><input id="geo-h" type="number" min="0.1" step="0.01"></label></div>
 <button id="geo-center" data-pe-text="置中裁切框">置中裁切框</button>
 <button id="geo-reset" data-pe-text="重設裁切框">重設裁切框</button>
 <label><select id="geo-drag-mode" aria-label="Crop interaction / 裁切操作"><option value="draw" data-pe-text="畫新框">畫新框</option><option value="move" data-pe-text="移動框">移動框</option></select></label>
 <label><input id="geo-result" type="checkbox"><span data-pe-text="顯示裁切結果">顯示裁切結果</span></label>
 <p data-pe-text="選「畫新框」重新框選，選「移動框」平移；固定紙張只能移動。也可輸入毫米數值。"></p></div>
 <label id="geo-reference-control"><span data-pe-text="參考頁碼">參考頁碼</span><select id="geo-reference"></select></label>
 <p id="geo-summary" role="status"></p><p id="geo-impact"></p><p id="geo-error" role="alert"></p>
 </div><div><div id="geo-preview-area"><canvas id="geo-preview" tabindex="0" aria-label="Page size preview / 頁面尺寸預覽" aria-describedby="geo-key-help"></canvas></div><p id="geo-key-help" data-pe-text="方向鍵移動 1 mm；Shift 為 10 mm，Alt 為 0.1 mm。結果預覽模式不能拖曳。"></p><p id="geo-resolution"></p></div></div>
 <p data-pe-text="套用前請確認預覽與影響說明；可在本次工作階段復原。"></p>
 <div class="geo-actions"><button id="geo-apply" class="primary" data-pe-text="套用頁面尺寸">套用頁面尺寸</button><button id="geo-cancel" data-pe-text="取消">取消</button></div>
</div>`;
document.body.append(geometryOverlay);
const geoEl=id=>document.getElementById('geo-'+id);
function geometryBackground(inert){for(const id of ['toolbar','main','stamp-overlay'])document.getElementById(id).inert=inert;}
function closePageGeometry(){
  if(documentIO.busy)return;
  const previous=pageGeometry?.focus;pageGeometry=null;geometryOverlay.hidden=true;geometryBackground(false);
  if(previous?.isConnected)previous.focus();
}
async function openPageGeometry(mode){
  if(pageGeometry||pageEdit.busy||documentIO.busy||!stampEditor.pageSize)return;
  if(pageEdit.draft&&!applyContentEditor())return;
  resetPageEditorTools();
  const pg=getActiveStampPage(),s={mode,pg,index:stampEditor.pageIndex,pages:state.mainPages,focus:document.activeElement,ready:false};pageGeometry=s;
  geometryOverlay.hidden=false;geometryBackground(true);geoEl('apply').disabled=true;geoEl('error').textContent='';
  geoEl('crop-controls').inert=true;geoEl('reference-control').inert=true;
  geoEl('preview').width=1;geoEl('preview').height=1;geoEl('resolution').textContent='';
  geoEl('result').checked=false;geoEl('drag-mode').value='draw';geoEl('key-help').hidden=mode!=='crop';
  geoEl('title').textContent=pt(mode==='crop'?'裁切頁面':'符合參考頁尺寸');
  geoEl('crop-controls').hidden=mode!=='crop';geoEl('reference-control').hidden=mode!=='fit';
  geoEl('impact').textContent=pt(mode==='crop'?'裁切只重建本頁為圖片，框外不保留；本頁文字失去搜尋能力，新增物件定稿，連結移除。其他頁不轉圖片。不是全文件個資清理。':'等比例縮放並置中補白，不拉伸、不裁掉內容。保留原 PDF 文字／向量；本頁新增物件定稿，連結移除。參考頁不變。');
  geometryOverlay.querySelectorAll('[data-pe-text]').forEach(el=>el.textContent=pt(el.dataset.peText));
  geoEl('summary').textContent=pt('處理中，請稍候');geoEl('cancel').focus();
  try{
    s.size=await getPageNaturalSize(pg);s.source=document.createElement('canvas');
    const previewScale=Math.min(780/s.size.width,680/s.size.height);
    await renderPagePreviewToCanvas(pg,s.source,Math.max(1,Math.round(s.size.width*previewScale)));await drawStampsOnCanvas(s.source,pg);
    if(pageGeometry!==s)return;s.ready=true;geoEl('crop-controls').inert=false;geoEl('reference-control').inert=false;
    if(mode==='crop'){
      resetGeometryRect();
    }else{
      geoEl('reference').replaceChildren();
      state.mainPages.forEach((p,i)=>{if(i===s.index)return;const option=document.createElement('option');option.value=String(i);option.textContent=String(i+1);geoEl('reference').append(option);});
      if(state.mainPages.length>1)geoEl('reference').value=String(s.index+1<state.mainPages.length?s.index+1:s.index-1);
      await selectGeometryReference();
    }
    refreshGeometryPreview();
  }catch(e){if(pageGeometry===s)geoEl('error').textContent=pt(e.pageEditMessage||'編輯失敗；原頁未套用此變更');}
}
function writeGeometryRect(){
  const s=pageGeometry;if(!s?.rect)return;
  for(const [id,key]of [['x','x'],['y','y'],['w','width'],['h','height']])geoEl(id).value=(s.rect[key]/PAGE_MM).toFixed(2);
  const fixed=geoEl('preset').value!=='custom';geoEl('w').readOnly=geoEl('h').readOnly=fixed;geoEl('landscape').disabled=!fixed;
  geoEl('drag-mode').disabled=fixed;if(fixed)geoEl('drag-mode').value='move';
}
function resetGeometryRect(){
  const s=pageGeometry;if(!s?.ready||s.mode!=='crop'||documentIO.busy)return;
  s.pointer=null;geoEl('preset').value='custom';geoEl('landscape').checked=false;geoEl('result').checked=false;geoEl('drag-mode').value='draw';
  s.rect={x:0,y:0,width:s.size.width,height:s.size.height};writeGeometryRect();refreshGeometryPreview();
}
function readGeometryRect(){
  if(!pageGeometry?.ready)return;
  pageGeometry.rect=Object.fromEntries([['x','x'],['y','y'],['w','width'],['h','height']].map(([id,key])=>[key,geoEl(id).value===''?NaN:Number(geoEl(id).value)*PAGE_MM]));refreshGeometryPreview();
}
function presetGeometryRect(){
  const s=pageGeometry;if(!s?.ready)return;
  const preset={a4:[210,297],b4jis:[257,364],b4iso:[250,353]}[geoEl('preset').value];
  if(preset){const [w,h]=geoEl('landscape').checked?[preset[1],preset[0]]:preset;s.rect={x:0,y:0,width:w*PAGE_MM,height:h*PAGE_MM};centerGeometryRect();}
  else{writeGeometryRect();refreshGeometryPreview();}
}
function centerGeometryRect(){const s=pageGeometry;if(!s?.ready)return;s.rect.x=Math.max(0,(s.size.width-s.rect.width)/2);s.rect.y=Math.max(0,(s.size.height-s.rect.height)/2);writeGeometryRect();refreshGeometryPreview();}
async function selectGeometryReference(){
  const s=pageGeometry;if(!s?.ready||s.mode!=='fit')return;
  s.target=null;const seq=s.sequence=(s.sequence||0)+1;refreshGeometryPreview();
  const index=Number(geoEl('reference').value);
  if(!geoEl('reference').value||index===s.index||!s.pages[index])return;
  try{const size=await getPageNaturalSize(s.pages[index]);if(pageGeometry===s&&s.sequence===seq){s.target=size;s.reference=s.pages[index];refreshGeometryPreview();}}
  catch(e){if(pageGeometry===s&&s.sequence===seq)geoEl('error').textContent=pt(e.pageEditMessage||'編輯失敗；原頁未套用此變更');}
}
function geometryCropIssue(s){
  const r=s?.rect;if(!r)return {message:'請輸入有效數字',fields:[]};
  const fields=[['x','x'],['y','y'],['w','width'],['h','height']];
  const invalid=fields.filter(([,key])=>!Number.isFinite(r[key])).map(([id])=>id);
  if(invalid.length)return {message:'請輸入有效數字',fields:invalid};
  if(r.x<0||r.y<0)return {message:'左距及上距不能小於零',fields:[...(r.x<0?['x']:[]),...(r.y<0?['y']:[])]};
  if(r.width<.1*PAGE_MM||r.height<.1*PAGE_MM)return {message:'寬高至少為 0.1 mm',fields:[...(r.width<.1*PAGE_MM?['w']:[]),...(r.height<.1*PAGE_MM?['h']:[])]};
  if(r.x+r.width>s.size.width+.04||r.y+r.height>s.size.height+.04)return {message:'裁切框超出頁面右側或下側',fields:[...(r.x+r.width>s.size.width+.04?['x','w']:[]),...(r.y+r.height>s.size.height+.04?['y','h']:[])]};
  return null;
}
function geometryValid(s){
  if(!s?.ready)return false;
  if(s.mode==='fit')return !!s.target&&[s.target.width,s.target.height].every(v=>Number.isFinite(v)&&v>0&&v<=14400);
  return !geometryCropIssue(s);
}
function refreshGeometryPreview(){
  const s=pageGeometry;if(!s?.ready)return;const valid=geometryValid(s);
  geoEl('apply').disabled=!valid;
  const issue=s.mode==='crop'?geometryCropIssue(s):null;
  geoEl('error').textContent=valid?'':pt(issue?.message||'請選擇同份文件的另一頁');
  for(const id of ['x','y','w','h']){geoEl(id).setAttribute('aria-invalid',String(!!issue?.fields.includes(id)));geoEl(id).setAttribute('aria-describedby','geo-error');}
  const result=s.mode==='crop'&&geoEl('result').checked&&valid;
  geoEl('preview').dataset.mode=s.mode==='fit'||result?'result':geoEl('drag-mode').value;
  geoEl('preview').setAttribute('aria-label',pt(result||s.mode==='fit'?'輸出預覽':'裁切選框'));
  const out=s.mode==='fit'?(s.target||s.size):result?s.rect:s.size,scale=Math.min(780/out.width,680/out.height);
  const c=geoEl('preview');c.width=Math.max(1,Math.round(out.width*scale));c.height=Math.max(1,Math.round(out.height*scale));const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);
  if(result){const r=s.rect;ctx.drawImage(s.source,r.x/s.size.width*s.source.width,r.y/s.size.height*s.source.height,r.width/s.size.width*s.source.width,r.height/s.size.height*s.source.height,0,0,c.width,c.height);}
  else if(s.mode==='crop'){
    ctx.drawImage(s.source,0,0,c.width,c.height);
    if(valid){const r=s.rect,sx=c.width/s.size.width,sy=c.height/s.size.height,x=r.x*sx,y=r.y*sy,w=r.width*sx,h=r.height*sy;
      ctx.fillStyle='#0008';ctx.fillRect(0,0,c.width,y);ctx.fillRect(0,y+h,c.width,c.height-y-h);ctx.fillRect(0,y,x,h);ctx.fillRect(x+w,y,c.width-x-w,h);
      ctx.strokeStyle='#007ac2';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,Math.max(0,w-2),Math.max(0,h-2));}
  }else{const k=Math.min(out.width/s.size.width,out.height/s.size.height),w=s.size.width*k,h=s.size.height*k;ctx.drawImage(s.source,(out.width-w)/2*scale,(out.height-h)/2*scale,w*scale,h*scale);}
  const dimensions=o=>[o.width,o.height].every(Number.isFinite)?`${(o.width/PAGE_MM).toFixed(2)} × ${(o.height/PAGE_MM).toFixed(2)} mm`:'—';
  geoEl('summary').textContent=`${s.index+1}: ${dimensions(s.size)} → ${dimensions(s.mode==='crop'?s.rect:(s.target||s.size))}`+(s.mode==='fit'&&s.target?` · ${(100*Math.min(s.target.width/s.size.width,s.target.height/s.size.height)).toFixed(1)}%`:'');
  const dpi=72*Math.min(300/72,Math.sqrt(PAGE_EDIT_LIMITS.pixels/(s.size.width*s.size.height)),16000/Math.max(s.size.width,s.size.height));
  geoEl('resolution').textContent=s.mode==='crop'?`${pt('估計輸出解析度')}: ${Math.round(dpi)} dpi`:'';
}
function moveGeometryRect(dx,dy){const s=pageGeometry;if(!s?.ready||s.mode!=='crop'||!geometryValid(s))return;s.rect={...s.rect,x:Math.max(0,Math.min(s.size.width-s.rect.width,s.rect.x+dx)),y:Math.max(0,Math.min(s.size.height-s.rect.height,s.rect.y+dy))};writeGeometryRect();refreshGeometryPreview();}
function geometryPoint(e){const c=geoEl('preview'),r=c.getBoundingClientRect(),s=pageGeometry.size;return {x:Math.max(0,Math.min(s.width,(e.clientX-r.left)/r.width*s.width)),y:Math.max(0,Math.min(s.height,(e.clientY-r.top)/r.height*s.height))};}
geoEl('preview').addEventListener('pointerdown',e=>{
  const s=pageGeometry;if(s?.mode!=='crop'||!s.ready||geoEl('result').checked||documentIO.busy||e.button!==0)return;e.preventDefault();e.currentTarget.focus();
  const p=geometryPoint(e);s.pointer={id:e.pointerId,start:p,rect:{...s.rect}};e.currentTarget.setPointerCapture(e.pointerId);
});
geoEl('preview').addEventListener('pointermove',e=>{
  const s=pageGeometry;if(!s?.pointer||s.pointer.id!==e.pointerId||documentIO.busy)return;e.preventDefault();const p=geometryPoint(e),a=s.pointer.start;
  if(geoEl('drag-mode').value==='draw')s.rect={x:Math.min(a.x,p.x),y:Math.min(a.y,p.y),width:Math.abs(a.x-p.x),height:Math.abs(a.y-p.y)};
  else {const r=s.pointer.rect;s.rect={...r,x:Math.max(0,Math.min(s.size.width-r.width,r.x+p.x-a.x)),y:Math.max(0,Math.min(s.size.height-r.height,r.y+p.y-a.y))};}
  writeGeometryRect();refreshGeometryPreview();
});
function cancelGeometryDrag(){const s=pageGeometry;if(!s?.pointer)return false;s.rect=s.pointer.rect;s.pointer=null;writeGeometryRect();refreshGeometryPreview();return true;}
geoEl('preview').addEventListener('pointerup',()=>{if(pageGeometry)pageGeometry.pointer=null;});
for(const type of ['pointercancel','lostpointercapture'])geoEl('preview').addEventListener(type,cancelGeometryDrag);
geoEl('fields').addEventListener('input',readGeometryRect);geoEl('preset').addEventListener('change',presetGeometryRect);geoEl('landscape').addEventListener('change',presetGeometryRect);
geoEl('center').onclick=centerGeometryRect;geoEl('reference').onchange=selectGeometryReference;geoEl('cancel').onclick=closePageGeometry;
geoEl('reset').onclick=resetGeometryRect;geoEl('result').onchange=refreshGeometryPreview;geoEl('drag-mode').onchange=refreshGeometryPreview;
async function geometryProgress(message,pct){showProgress(pt(message),pct);await new Promise(resolve=>setTimeout(resolve,0));}
geoEl('apply').onclick=async()=>{
  const s=pageGeometry;if(documentIO.busy||!geometryValid(s))return;
  if(state.mainPages!==s.pages||state.mainPages[s.index]!==s.pg){geoEl('error').textContent=pt('頁面已變更，請重新開啟編輯器');return;}
  setDocumentBusy(true);
  try{
    let changed=true;
    if(s.mode==='crop'){
      const r={...s.rect};r.width=Math.min(r.width,s.size.width-r.x);r.height=Math.min(r.height,s.size.height-r.y);
      if(r.x<.01&&r.y<.01&&Math.abs(r.width-s.size.width)<.05&&Math.abs(r.height-s.size.height)<.05)changed=false;
      else await erasePageArea(s.pg,r,true,geometryProgress);
    }else changed=await fitPageToReference(s.pg,s.reference,geometryProgress);
    hideProgress();setDocumentBusy(false);closePageGeometry();setStatus(pt(changed?'頁面尺寸已更新，可復原':'尺寸未變更'));
  }catch(e){hideProgress();setDocumentBusy(false);geometryBackground(true);geoEl('error').textContent=pt(e.pageEditMessage||'編輯失敗；原頁未套用此變更');geoEl('cancel').focus();}
};
// Capture before the global editor shortcuts so Delete/Undo cannot affect a page
// while the preview dialog is open. Native input editing is left intact.
document.addEventListener('keydown',e=>{
  if(!pageGeometry||documentIO.busy)return;e.stopImmediatePropagation();
  if(e.key==='Escape'){e.preventDefault();if(!cancelGeometryDrag())closePageGeometry();}
  if(e.target===geoEl('preview')&&pageGeometry.mode==='crop'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
    e.preventDefault();const step=(e.altKey ? 0.1 : e.shiftKey ? 10 : 1)*PAGE_MM;moveGeometryRect(e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0,e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0);
  }
  if(e.key==='Tab'){const nodes=[...geometryOverlay.querySelectorAll('button,input,select,canvas[tabindex]')].filter(el=>!el.disabled&&el.getClientRects().length),first=nodes[0],last=nodes.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
},true);
document.addEventListener('paste',e=>{if(pageGeometry){e.stopImmediatePropagation();if(!e.target.closest?.('input,textarea'))e.preventDefault();}},true);

function invertPageMatrix(m){const [a,b,c,d,e,f]=m,det=a*d-b*c;if(!Number.isFinite(det)||Math.abs(det)<1e-10)throw Error('Invalid transform');return [d/det,-b/det,-c/det,a/det,(c*f-d*e)/det,(b*e-a*f)/det];}
async function fitPageToReference(pg,reference,progress=async()=>{}){
  const original=state.mainPages,index=original.indexOf(pg);
  if(index<0||!reference||reference===pg||!original.includes(reference))throw pageEditError('請選擇同份文件的另一頁');
  const size=await getPageNaturalSize(pg),target=await getPageNaturalSize(reference);
  if(![target.width,target.height].every(v=>Number.isFinite(v)&&v>0&&v<=14400))throw Error('Invalid size');
  if(Math.abs(size.width-target.width)<.01&&Math.abs(size.height-target.height)<.01)return false;
  await progress('正在準備頁面',10);
  // Refuse interactive structures rather than silently dropping their appearance.
  await assertErasureSources(original);
  const geometry=pg.sourceType==='image'?{...size,toPdf:[1,0,0,1,0,0]}:await getPdfPageGeometry(pg);
  const source=await PDFLib.PDFDocument.create();await appendPageToPdfDocument(source,pg,new Map(),true);
  const safeSource=await PDFLib.PDFDocument.load(await saveEditedPdf(source,original,[pg]),{updateMetadata:false});
  const sourcePage=safeSource.getPage(0);sourcePage.pushOperators(PDFLib.pushGraphicsState(),PDFLib.popGraphicsState());
  const [a,b,c,d,e,f]=geometry.toPdf;
  const corners=[[0,0],[size.width,0],[0,size.height],[size.width,size.height]].map(([x,y])=>[a*x+c*y+e,b*x+d*y+f]);
  const bbox={left:Math.min(...corners.map(p=>p[0])),right:Math.max(...corners.map(p=>p[0])),bottom:Math.min(...corners.map(p=>p[1])),top:Math.max(...corners.map(p=>p[1]))};
  const out=await PDFLib.PDFDocument.create(),embedded=await out.embedPage(sourcePage,bbox,invertPageMatrix(geometry.toPdf));
  await progress('正在校正尺寸',45);
  const k=Math.min(target.width/size.width,target.height/size.height),p=out.addPage([target.width,target.height]);
  p.drawPage(embedded,{x:(target.width-size.width*k)/2,y:(target.height-size.height*k)/2,xScale:k,yScale:k});
  const bytes=await saveEditedPdf(out,original,[pg]);
  const replacement={id:pg.id,sourceType:'main_pdf',sourcePath:pg.sourcePath,pageIndex:0,pdfBytes:bytes,imageDataUrl:null,
    stamps:[],origin:pg.origin,linkSourceIdentity:pdfLinkIdentity(pg),geometryChanged:true,
    requiresResourceCleanup:pg.requiresResourceCleanup,erasureImageHashes:pg.erasureImageHashes};
  const candidate=original.map((item,i)=>({... (i===index?replacement:item),requiresLinkRebuild:true}));
  await progress('正在檢查完整輸出',70);
  const probe=await PDFLib.PDFDocument.create(),cache=new Map();for(const item of candidate)await appendPageToPdfDocument(probe,item,cache,true);
  await saveEditedPdf(probe,candidate);
  if(state.mainPages!==original||state.mainPages[index]!==pg)throw pageEditError('頁面已變更，請重新開啟編輯器');
  snapshotForUndo();state.mainPages=candidate;stampEditor.activeStampId=null;invalidateStampPage(candidate[index]);await renderStampEditor();
  return true;
}
