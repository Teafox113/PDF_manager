/* Project-owned editing tools. All clipboard/document processing stays local. */
'use strict';
const pageEdit = { draft: null, erase: false, start: null, busy: false, previousFocus: null };
const PAGE_EDIT_LIMITS = { rows: 60, cols: 20, cell: 2000, text: 10000, pixels: 24000000 };
// The edited page is rasterized; every export prunes unused resources and fails
// closed on unsupported structures or surviving shared source images.
const PAGE_ERASURE_ENABLED = true;
const PAGE_EDIT_TEXT = {
  '取消匯出':'Cancel export',
  '正在取消，等待目前步驟完成…':'Cancelling; waiting for the current step…',
  '匯出已取消；編輯內容保留，未產生下載。':'Export cancelled. Edits are preserved; no download was generated.',
  '來源載入失敗；舊來源及主文件均已保留。請檢查檔案格式、密碼或損壞情況。':'Source import failed. The previous sources and main document are preserved. Check the format, password or file integrity.',
  '請選擇 PDF／圖片，或單一 DOCX；不支援舊版 DOC 或其他格式。':'Choose PDFs/images or one DOCX. Legacy DOC and other formats are not supported.',
  '來源批次載入失敗保護、可取消匯出與無障礙進度提示。':'Atomic source imports, cancellable exports and accessible progress feedback.',
  '↪ 重做':'↪ Redo', '已重做':'Redo applied', '有尚未匯出的修改':'Changes not exported', '本機工作階段':'Local session', '尚未載入文件':'No document loaded',
  '不會自動儲存文件；匯出後請確認下載檔案。':'Documents are not saved automatically; verify your downloaded file after export.',
  '已產生下載，請確認檔案已存妥。':'Download generated. Please verify the file was saved.',
  '更換主文件？':'Replace the main document?', '目前有尚未匯出的修改。繼續將捨棄本次工作階段；請先匯出需要的內容。':'There are changes that have not been exported. Continuing discards this session; export anything you need first.',
  '無法載入此 PDF，原工作階段已保留。請確認檔案未損壞且不需密碼。':'Cannot load this PDF. Your current session is preserved. Check that the file is valid and does not require a password.',
  '字級需為 8–72，框寬需在頁面寬度範圍內。':'Font size must be 8–72 and box width must fit within the page.',
  '草稿尚未套用':'Draft not applied', '可套用':'Ready to apply', '文字':'characters', '未修改':'Unchanged',
  '穩定性與操作打磨：重做、未匯出提醒、即時文字檢查與視窗自適應。':'Workflow polish: redo, unexported-change warnings, live text validation and responsive page editing.',
  '頁面內直接輸入文字，搭配字型與段落格式工具列。':'Type text directly on the page with font and paragraph formatting tools.',
  '直接輸入；格式套用整個文字框。Ctrl+Enter 完成，Esc 取消；完成後拖曳移動。':'Type on the page; formatting affects the whole text box. Ctrl+Enter to finish, Esc to cancel; drag after finishing.',
  '字型':'Font', '黑體':'Sans serif', '明體':'Serif', '等寬':'Monospace', '斜體':'Italic', '底線':'Underline',
  '對齊':'Alignment', '靠左':'Left', '置中':'Center', '靠右':'Right', '行距':'Line spacing', '框寬（pt）':'Width (pt)',
  '文字超出本頁範圍；請減少內容、字級或調整框寬。':'Text exceeds the page bounds; reduce the content/font size or adjust the box width.',
  '普通超連結相容修正；消去阻擋訊息顯示頁碼與原因。':'Ordinary link compatibility; erasure errors show page numbers and reasons.',
  '頁面編輯測試版：貼上圖片、文字、可編輯表格與局部消去。':'Page editor preview: paste images, text, editable tables, and erase areas.',
  '✕ 刪除物件':'✕ Delete object',
  '✎ 編輯頁面':'✎ Edit page', '頁面編輯':'Page editor',
  '貼上剪貼簿':'Paste clipboard', '加入文字':'Add text', '加入表格':'Add table',
  '修改文字／表格':'Edit text / table', '框選消去':'Erase area', '取消消去':'Cancel erase',
  '復原':'Undo', 'Ctrl+V 貼上；雙擊新增的文字或表格可修改':'Ctrl+V to paste; double-click added text or tables to edit',
  '文字／表格內容':'Text / table content', '字級':'Font size', '顏色':'Color', '粗體':'Bold',
  '插入列':'Insert row', '刪除列':'Delete row', '插入欄':'Insert column', '刪除欄':'Delete column',
  '先點選儲存格，再於該列／欄後插入或刪除':'Select a cell to insert after or delete its row / column',
  '另存 PDF 後新增內容會定稿；原有文字保留，消去功能尚未開放。':'Added content is flattened on PDF export. Original text is preserved; erasure is not yet available.',
  '消去尚未開放；正在驗證保留其他頁文字的刪除引擎。':'Erasure is unavailable pending validation of an engine that preserves text on other pages.',
  '此 PDF 含尚未支援的結構或跨頁共用圖片，無法安全消去；原文件未變更。':'This PDF contains unsupported structures or shared images still in use. Erasure was refused; the original document is unchanged.',
  '另存 PDF 後新增內容會定稿；消去只將編輯頁轉成圖片，其他頁文字保留。':'Added content is flattened on export. Erasure rasterizes only the edited page; text on other pages is preserved.',
  '只重建本頁，清除框選區域；本頁文字及表格將定稿。其他頁不轉成圖片。若含不支援的結構或其他頁仍使用原圖片，操作會拒絕。這不是整份文件的個資清理。':'Only this page is rebuilt with the selected area erased; its text and tables are flattened. Other pages are not rasterized. Unsupported structures or original images still used elsewhere cause rejection. This is not document-wide sanitization.',
  '框選消去；僅編輯頁圖片化，不支援的文件會拒絕操作。':'Erase an area; only the edited page is rasterized. Unsupported documents are rejected.',
  '套用內容':'Apply content', '取消':'Cancel',
  '請先載入並選取左側的一頁':'Load and select one main page first',
  '請按 Ctrl+V 貼上；此瀏覽器不允許按鈕讀取剪貼簿。':'Press Ctrl+V to paste; this browser does not allow clipboard access from the button.',
  '剪貼簿沒有支援的圖片、文字或表格':'No supported image, text, or table in the clipboard',
  '資料過大；表格最多 60 列、20 欄，每格 2000 字，文字最多 10000 字。':'Content too large: at most 60 rows, 20 columns, 2000 characters per cell, or 10000 text characters.',
  '合併儲存格已展開為一般儲存格；請在套用前檢查。':'Merged cells were expanded into regular cells; review before applying.',
  '請輸入文字':'Enter some text', '新增文字':'New text', '表格':'Table',
  '圖片尺寸過大':'Image dimensions are too large', '剪貼簿圖片':'Clipboard image',
  '請先選取本次新增的文字或表格':'Select text or a table added in this session first',
  '框選要消去的區域；按 Esc 取消':'Drag over the area to erase; press Esc to cancel',
  '確定消去此區域？':'Erase this area?',
  '整頁將重新建立為圖片，框選區域以白色清除；本頁文字、表格及印章會定稿，不能再搜尋或逐格修改。可在本次工作階段復原。這不是整份文件的個資清理；其他頁、重複內容仍須另行檢查。':'The entire page will be rebuilt as an image, with the selected area cleared to white. Text, tables and stamps on this page will be flattened and no longer searchable or editable as cells. Session undo remains available. This is not document-wide sanitization: check other pages and repeated content separately.',
  '處理中，請稍候':'Processing, please wait', '消去完成；本頁已重新建立':'Area erased; page rebuilt',
  '編輯失敗；原頁未套用此變更':'Edit failed; this change was not applied to the original page',
  '頁面已變更，請重新開啟編輯器':'The page changed; reopen the editor',
  '保留至少一列及一欄':'Keep at least one row and one column',
};
function pt(key) { return document.documentElement.lang === 'en' ? (PAGE_EDIT_TEXT[key] || key) : key; }
function refreshPageEditorLanguage() {
  document.querySelectorAll('[data-pe-text]').forEach(el => { el.textContent = pt(el.dataset.peText); });
  document.getElementById('pe-erase').textContent = pt(pageEdit.erase ? '取消消去' : '框選消去');
  document.getElementById('pe-erase').disabled = !PAGE_ERASURE_ENABLED;
  document.getElementById('pe-erase').title = pt('框選消去；僅編輯頁圖片化，不支援的文件會拒絕操作。');
  updateInlineText();refreshSessionState();
}
function pageEditBusy() { return pageEdit.busy; }
function pageEraseActive() { return pageEdit.erase || pageEdit.busy || pageEdit.draft?.kind==='text'; }
function refreshPageObjectControls() {
  const st = getActiveStamp();
  document.getElementById('pe-edit').disabled = !st?.content;
  document.getElementById('pe-undo').disabled = !undoStack.length;
  document.getElementById('pe-redo').disabled = !redoStack.length;
}
function resetPageEditorTools() {
  pageEdit.erase = false; pageEdit.start = null;
  document.getElementById('stamp-page-wrap').classList.remove('erasing');
  document.getElementById('page-erase-box')?.remove();
  closeContentEditor(); refreshPageEditorLanguage();
}
async function runPageTask(task) {
  if (pageEdit.busy) return;
  pageEdit.busy = true;
  document.getElementById('stamp-overlay').classList.add('page-busy');
  try { await task(); }
  catch (error) { alert(pt(error.pageEditMessage || '編輯失敗；原頁未套用此變更')); }
  finally { pageEdit.busy = false; document.getElementById('stamp-overlay').classList.remove('page-busy'); refreshPageObjectControls(); }
}
function pageEditError(message) { const error = new Error('Page editor validation'); error.pageEditMessage = message; return error; }
function validateRows(rows) {
  if (!rows.length || rows.length > PAGE_EDIT_LIMITS.rows || rows.some(row => !row.length || row.length > PAGE_EDIT_LIMITS.cols || row.some(c => String(c).length > PAGE_EDIT_LIMITS.cell)))
    throw pageEditError('資料過大；表格最多 60 列、20 欄，每格 2000 字，文字最多 10000 字。');
  const cols = Math.max(...rows.map(r => r.length));
  return rows.map(row => Array.from({length: cols}, (_,i) => String(row[i] ?? '')));
}
function parseClipboardTable(html, plain) {
  // A template is inert: never insert clipboard HTML, styles, links or images in the live DOM.
  if (html.length > 2000000 || plain.length > 250000) throw pageEditError('資料過大；表格最多 60 列、20 欄，每格 2000 字，文字最多 10000 字。');
  if (html) {
    const template = document.createElement('template'); template.innerHTML = html;
    const table = template.content.querySelector('table');
    if (table) {
      table.querySelectorAll('script,style,iframe,object,embed,svg,img').forEach(node => node.remove());
      const rows = []; let merged = false;
      const sourceRows = [...table.rows];
      if (sourceRows.length > PAGE_EDIT_LIMITS.rows) throw pageEditError('資料過大；表格最多 60 列、20 欄，每格 2000 字，文字最多 10000 字。');
      sourceRows.forEach((tr,r) => {
        rows[r] ||= []; let c = 0;
        for (const cell of tr.cells) {
          while (rows[r][c] !== undefined) c++;
          const rs = cell.rowSpan === 0 ? sourceRows.length-r : Math.max(1,cell.rowSpan);
          const cs = Math.max(1,cell.colSpan);
          if (r+rs > PAGE_EDIT_LIMITS.rows || c+cs > PAGE_EDIT_LIMITS.cols) throw pageEditError('資料過大；表格最多 60 列、20 欄，每格 2000 字，文字最多 10000 字。');
          merged ||= rs>1 || cs>1;
          for (let a=0;a<rs;a++) for(let b=0;b<cs;b++) { rows[r+a] ||= []; rows[r+a][c+b] = a===0 && b===0 ? cell.textContent.trim() : ''; }
          c += cs;
        }
      });
      return {rows:validateRows(rows),merged};
    }
  }
  if (plain.includes('\t')) {
    const lines = plain.replace(/\r\n?/g,'\n').replace(/\n$/,'').split('\n');
    return {rows:validateRows(lines.map(line=>line.split('\t'))),merged:false};
  }
  return null;
}
function openContentEditor(kind, content = null, stampId = null) {
  if (pageEdit.busy || !getActiveStampPage() || !stampEditor.pageSize) return;
  if(pageEdit.draft?.kind==='text' && !applyContentEditor())return;
  pageEdit.erase = false; document.getElementById('stamp-page-wrap').classList.remove('erasing');
  pageEdit.previousFocus = document.activeElement;
  pageEdit.draft = {kind,stampId,pageId:getActiveStampPage().id,row:0,col:0,
    rows:kind==='table' ? validateRows(content?.rows || [['','',''],['','',''],['','','']]) : null};
  document.getElementById('pe-font-size').value = content?.fontSize || 18;
  document.getElementById('pe-color').value = content?.color || '#111111';
  document.getElementById('pe-bold').checked = !!content?.bold;
  document.getElementById('pe-text-value').value = content?.text || '';
  if(kind==='text') { openInlineText(content,stampId);return; }
  document.getElementById('pe-text-value').hidden = kind!=='text';
  document.getElementById('pe-table-controls').hidden = kind!=='table';
  document.getElementById('pe-table-controls').style.display = kind==='table' ? 'flex' : 'none';
  document.getElementById('pe-grid-wrap').hidden = kind!=='table';
  if(kind==='table') renderTableGrid();
  document.getElementById('page-content-overlay').hidden = false;
  refreshPageEditorLanguage();
  (kind==='text' ? document.getElementById('pe-text-value') : document.querySelector('#pe-grid input'))?.focus();
}
function closeContentEditor() {
  const dialog=document.getElementById('page-content-dialog'),toolbar=document.getElementById('pe-text-toolbar');
  if(pageEdit.draft?.kind==='text') {
    const field=document.getElementById('pe-text-value');field.removeAttribute('style');field.hidden=true;
    dialog.insertBefore(document.getElementById('pe-format-controls'),document.getElementById('pe-table-controls'));
    dialog.insertBefore(field,document.getElementById('pe-table-controls'));
    dialog.append(document.getElementById('pe-apply').parentElement);
    document.getElementById('pe-text-extras').hidden=true;
    document.querySelectorAll('.stamp-item').forEach(el=>el.style.visibility='');
  }
  toolbar.hidden=true;
  document.getElementById('page-content-overlay').hidden = true;
  pageEdit.draft = null;
  if (pageEdit.previousFocus?.isConnected) pageEdit.previousFocus.focus();
  pageEdit.previousFocus = null;
  refreshSessionState();
}
const PAGE_TEXT_FONTS=['sans-serif','serif','monospace','Microsoft JhengHei','Arial','Times New Roman'];
function pageTextFont(content) {
  const family=PAGE_TEXT_FONTS.includes(content.fontFamily)?content.fontFamily:'sans-serif';
  return `${content.italic?'italic ':''}${content.bold?'bold ':''}${content.fontSize}px ${family.includes(' ')?'"'+family+'"':family}`;
}
function readInlineText() {
  return {kind:'text',text:document.getElementById('pe-text-value').value,
    fontSize:Math.max(8,Math.min(72,Number(document.getElementById('pe-font-size').value)||18)),
    color:document.getElementById('pe-color').value,bold:document.getElementById('pe-bold').checked,
    italic:document.getElementById('pe-italic').checked,underline:document.getElementById('pe-underline').checked,
    fontFamily:document.getElementById('pe-font-family').value,align:document.getElementById('pe-align').value,
    lineHeight:Number(document.getElementById('pe-line-height').value)||1.4,
    boxWidth:Math.max(40,Math.min(stampEditor.pageSize.width,Number(document.getElementById('pe-text-width').value)||280))};
}
function openInlineText(content,stampId) {
  const old=getActiveStampPage().stamps?.find(st=>st.id===stampId),size=stampEditor.pageSize,d=pageEdit.draft;
  d.x=old?.x??size.width*.08;d.top=old?size.height-old.y-old.height:size.height*.08;
  // Adopt visible size after an earlier drag-resize; keep the top-left anchored.
  const ratio=old?old.width/(content?.boxWidth||renderPageContent(content).width):1;
  document.getElementById('pe-font-size').value=Math.max(8,Math.min(72,(content?.fontSize||18)*ratio));
  document.getElementById('pe-font-family').value=PAGE_TEXT_FONTS.includes(content?.fontFamily)?content.fontFamily:'sans-serif';
  document.getElementById('pe-italic').checked=!!content?.italic;
  document.getElementById('pe-underline').checked=!!content?.underline;
  document.getElementById('pe-align').value=content?.align||'left';
  document.getElementById('pe-line-height').value=String(content?.lineHeight||1.4);
  document.getElementById('pe-text-width').value=old?.width||Math.min(320,size.width*.8);
  const toolbar=document.getElementById('pe-text-toolbar');
  toolbar.prepend(document.getElementById('pe-format-controls'));
  toolbar.insertBefore(document.getElementById('pe-apply').parentElement,document.getElementById('pe-inline-hint'));
  toolbar.hidden=false;document.getElementById('pe-text-extras').hidden=false;
  document.getElementById('page-content-overlay').hidden=true;
  const field=document.getElementById('pe-text-value');field.hidden=false;
  document.getElementById('stamp-page-wrap').append(field);
  stampEditor.drag=null;stampEditor.resize=null;stampEditor.cropMode=false;
  d.initialInline=JSON.stringify(readInlineText());
  refreshPageEditorLanguage();updateInlineText();field.focus();field.setSelectionRange(field.value.length,field.value.length);
  field.scrollIntoView({block:'nearest',inline:'nearest'});
}
function updateInlineText() {
  const d=pageEdit.draft;if(d?.kind!=='text')return;
  const c=readInlineText(),field=document.getElementById('pe-text-value'),scale=stampEditor.scale;
  const measure=document.createElement('canvas').getContext('2d');measure.font=pageTextFont(c);
  const height=wrapPageText(measure,c.text,c.boxWidth-20).length*c.fontSize*c.lineHeight+20;
  const issue=inlineTextIssue(height),status=document.getElementById('pe-draft-status');
  status.textContent=issue?pt(issue):`${c.text.length} / ${PAGE_EDIT_LIMITS.text} ${pt('文字')} · ${pt(pageDraftChanged()?'草稿尚未套用':'未修改')} · ${pt('可套用')}`;
  status.classList.toggle('error',!!issue);field.setAttribute('aria-invalid',String(!!issue));field.setAttribute('aria-describedby','pe-draft-status');
  d.x=Math.max(0,Math.min(d.x,stampEditor.pageSize.width-c.boxWidth));
  const visibleHeight=Math.max(1,Math.min(height,stampEditor.pageSize.height-d.top));
  Object.assign(field.style,{left:d.x*scale+'px',top:d.top*scale+'px',width:c.boxWidth+'px',height:visibleHeight+'px',
    padding:'10px',font:pageTextFont(c),lineHeight:String(c.lineHeight),color:c.color,textAlign:c.align,
    textDecoration:c.underline?'underline':'none',transform:`scale(${scale})`});
  document.querySelectorAll('.stamp-item').forEach(el=>{el.style.visibility=el.dataset.id===d.stampId?'hidden':'';});
  refreshSessionState();
}
function inlineTextIssue(height) {
  const d=pageEdit.draft;if(d?.kind!=='text')return null;
  const size=Number(document.getElementById('pe-font-size').value),width=Number(document.getElementById('pe-text-width').value);
  if(!Number.isFinite(size)||size<8||size>72||!Number.isFinite(width)||width<40||width>stampEditor.pageSize.width)return '字級需為 8–72，框寬需在頁面寬度範圍內。';
  if(document.getElementById('pe-text-value').value.length>PAGE_EDIT_LIMITS.text)return '資料過大；表格最多 60 列、20 欄，每格 2000 字，文字最多 10000 字。';
  if(height>stampEditor.pageSize.height-d.top)return '文字超出本頁範圍；請減少內容、字級或調整框寬。';
  return null;
}
function pageDraftChanged() {
  const d=pageEdit.draft;if(!d)return false;
  if(d.kind==='text')return d.stampId?JSON.stringify(readInlineText())!==d.initialInline:!!document.getElementById('pe-text-value').value.trim();
  return true;
}
let pageResizeTimer,lastPageWorkWidth=0;
new ResizeObserver(entries=>{
  const width=entries[0].target.clientWidth;
  if(width===lastPageWorkWidth)return;lastPageWorkWidth=width;clearTimeout(pageResizeTimer);
  if(!document.getElementById('stamp-overlay').classList.contains('show'))return;
  pageResizeTimer=setTimeout(()=>{if(getActiveStampPage()&&!pageEdit.busy&&!documentIO.busy&&stampEditor.renderWorkWidth!==width)renderStampEditor().catch(()=>setStatus(pt('編輯失敗；原頁未套用此變更')));},150);
}).observe(document.getElementById('stamp-work'));
document.getElementById('pe-text-value').addEventListener('input',updateInlineText);
document.getElementById('pe-format-controls').addEventListener('input',updateInlineText);
// Commit before switching tools or closing the page editor; toolbar/text clicks
// keep native selection, IME composition, clipboard and text undo intact.
document.getElementById('stamp-page-wrap').addEventListener('mousedown',e=>{
  const item=e.target.closest('.stamp-item');
  if(e.detail!==2||!item||pageEraseActive()||e.target.closest('.stamp-handle,.stamp-crop-handle'))return;
  const st=getActiveStampPage()?.stamps?.find(s=>s.id===item.dataset.id);if(!st?.content)return;
  // Selection redraw detaches the first mousedown target, so native click and
  // dblclick may never fire. The second mousedown still carries detail=2.
  e.preventDefault();e.stopImmediatePropagation();stampEditor.activeStampId=st.id;
  pageEdit.ignoreOpeningClickUntil=e.timeStamp+250;openContentEditor(st.content.kind,st.content,st.id);
},true);
document.getElementById('stamp-overlay').addEventListener('click',e=>{
  if(pageEdit.draft?.kind!=='text'||e.target.closest('#pe-text-toolbar,#pe-text-value'))return;
  if(e.timeStamp<pageEdit.ignoreOpeningClickUntil && e.target.closest('#stamp-page-wrap')){e.preventDefault();e.stopImmediatePropagation();return;}
  if(!applyContentEditor()){e.preventDefault();e.stopImmediatePropagation();}
},true);
function renderTableGrid() {
  const grid = document.getElementById('pe-grid'); grid.replaceChildren();
  pageEdit.draft.rows.forEach((row,r)=>{
    const tr=document.createElement('tr');
    row.forEach((value,c)=>{
      const td=document.createElement('td'), input=document.createElement('input');
      input.type='text'; input.value=value; input.maxLength=PAGE_EDIT_LIMITS.cell;
      input.dataset.row=r; input.dataset.col=c; input.setAttribute('aria-label',`R${r+1} C${c+1}`);
      input.onfocus=()=>{pageEdit.draft.row=r;pageEdit.draft.col=c;};
      input.oninput=()=>{pageEdit.draft.rows[r][c]=input.value;};
      td.append(input);tr.append(td);
    });grid.append(tr);
  });
}
function changeTableShape(axis, delta) {
  const d=pageEdit.draft;if(!d || d.kind!=='table')return;
  const rows=d.rows.map(r=>[...r]);
  if(delta<0 && (axis==='row'?rows.length:rows[0].length)===1){alert(pt('保留至少一列及一欄'));return;}
  if(axis==='row') { if(delta>0)rows.splice(d.row+1,0,Array(rows[0].length).fill(''));else rows.splice(d.row,1); }
  else rows.forEach(row=>delta>0?row.splice(d.col+1,0,''):row.splice(d.col,1));
  try { d.rows=validateRows(rows);d.row=Math.min(d.row,d.rows.length-1);d.col=Math.min(d.col,d.rows[0].length-1);renderTableGrid(); }
  catch(e){alert(pt(e.pageEditMessage));}
}
function editPageObject() {
  const st=getActiveStamp();if(!st?.content){alert(pt('請先選取本次新增的文字或表格'));return;}
  openContentEditor(st.content.kind,st.content,st.id);
}
function wrapPageText(ctx, value, width) {
  const lines=[];
  for(const paragraph of String(value).split(/\r?\n/)) {
    let line='';
    for(const ch of Array.from(paragraph)) {
      if(line && ctx.measureText(line+ch).width>width){lines.push(line);line=ch;}else line+=ch;
    } lines.push(line);
  }
  return lines;
}
function renderPageContent(content) {
  const scale=3, pad=10, lineHeight=content.fontSize*(content.lineHeight||1.4);
  const measure=document.createElement('canvas').getContext('2d');
  const font=pageTextFont(content);measure.font=font;
  let width,height,lines,colWidths,rowHeights;
  if(content.kind==='text') {
    lines=wrapPageText(measure,content.text,content.boxWidth?content.boxWidth-pad*2:560);
    width=content.boxWidth||Math.max(40,...lines.map(line=>measure.measureText(line).width))+pad*2;
    height=lines.length*lineHeight+pad*2;
  } else {
    colWidths=content.rows[0].map((_,c)=>Math.min(260,Math.max(80,...content.rows.map(row=>measure.measureText(row[c]).width+pad*2))));
    lines=content.rows.map(row=>row.map((cell,c)=>wrapPageText(measure,cell,colWidths[c]-pad*2)));
    rowHeights=lines.map(row=>Math.max(...row.map(cell=>cell.length))*lineHeight+pad*2);
    width=colWidths.reduce((a,b)=>a+b,0);height=rowHeights.reduce((a,b)=>a+b,0);
  }
  if(width*height*scale*scale>PAGE_EDIT_LIMITS.pixels || width*scale>16000 || height*scale>16000)
    throw pageEditError('資料過大；表格最多 60 列、20 欄，每格 2000 字，文字最多 10000 字。');
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(width*scale);canvas.height=Math.ceil(height*scale);
  const ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.font=font;ctx.textBaseline='top';ctx.fillStyle=content.color;
  if(content.kind==='text')lines.forEach((line,i)=>{
    const textWidth=measure.measureText(line).width;
    const x=content.align==='center'?(width-textWidth)/2:content.align==='right'?width-pad-textWidth:pad;
    let y=pad+i*lineHeight;
    if(content.boxWidth) {
      // Match the textarea's CSS line box rather than canvas textBaseline=top.
      const metrics=measure.measureText('Mg'),ascent=metrics.fontBoundingBoxAscent??content.fontSize*.8,descent=metrics.fontBoundingBoxDescent??content.fontSize*.2;
      ctx.textBaseline='alphabetic';y+=(lineHeight-ascent-descent)/2+ascent;
    }
    ctx.fillText(line,x,y);
    if(content.underline){ctx.fillRect(x,y+(content.boxWidth?content.fontSize/12:content.fontSize+1),textWidth,Math.max(.7,content.fontSize/18));}
  });
  else {
    ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.strokeStyle='#444';ctx.lineWidth=1;
    let y=0;
    lines.forEach((row,r)=>{let x=0;row.forEach((cell,c)=>{
      ctx.strokeRect(x+.5,y+.5,colWidths[c]-1,rowHeights[r]-1);ctx.fillStyle=content.color;
      cell.forEach((line,i)=>ctx.fillText(line,x+pad,y+pad+i*lineHeight));x+=colWidths[c];
    });y+=rowHeights[r];});
  }
  return {imageDataUrl:canvas.toDataURL('image/png'),naturalW:canvas.width,naturalH:canvas.height,width,height};
}
function applyContentEditor() {
  const d=pageEdit.draft;if(!d || pageEdit.busy)return;
  try {
    const pg=getActiveStampPage();if(pg?.id!==d.pageId)throw pageEditError('頁面已變更，請重新開啟編輯器');
    if(d.kind==='text') {
      const issue=inlineTextIssue();if(issue)throw pageEditError(issue);
      if(d.stampId && !pageDraftChanged()){closeContentEditor();renderStampOverlays();return true;}
    }
    const content=d.kind==='text'?readInlineText():{kind:d.kind,fontSize:Math.max(8,Math.min(72,Number(document.getElementById('pe-font-size').value)||18)),
      color:document.getElementById('pe-color').value,bold:document.getElementById('pe-bold').checked};
    if(d.kind==='text'){
      content.text=document.getElementById('pe-text-value').value;
      if(!content.text.trim()) {
        if(d.stampId && pg.stamps?.some(st=>st.id===d.stampId)) {
          snapshotForUndo();pg.stamps=pg.stamps.filter(st=>st.id!==d.stampId);stampEditor.activeStampId=null;invalidateStampPage(pg);
        }
        closeContentEditor();renderStampOverlays();return true;
      }
      if(content.text.length>PAGE_EDIT_LIMITS.text)throw pageEditError('資料過大；表格最多 60 列、20 欄，每格 2000 字，文字最多 10000 字。');
    }else content.rows=validateRows(d.rows);
    const rendered=renderPageContent(content), old=pg.stamps?.find(st=>st.id===d.stampId);
    const {width:pageW,height:pageH}=stampEditor.pageSize;
    if(d.kind==='text' && rendered.height>pageH-d.top)throw pageEditError('文字超出本頁範圍；請減少內容、字級或調整框寬。');
    const factor=Math.min(1,pageW*.8/rendered.width,pageH*.8/rendered.height);
    const width=old ? Math.min(old.width,pageW*.9) : rendered.width*factor;
    const height=width*rendered.naturalH/rendered.naturalW;
    const fit=Math.min(1,pageH*.9/height);
    const stamp={id:old?.id||uid(),type:'image',sourceName:pt(d.kind==='text'?'新增文字':'表格'),
      ...rendered,content,width:width*fit,height:height*fit,
      x:Math.max(0,Math.min(old?.x??pageW*.08,pageW-width*fit)),
      y:Math.max(0,Math.min(old?.y??pageH-height*fit-pageH*.08,pageH-height*fit)),
      flipX:false,flipY:false,crop:{l:0,t:0,r:0,b:0}};
    if(d.kind==='text')Object.assign(stamp,{width:rendered.width,height:rendered.height,x:d.x,y:pageH-d.top-rendered.height});
    snapshotForUndo();pg.stamps ||= [];
    if(old)pg.stamps[pg.stamps.indexOf(old)]=stamp;else pg.stamps.push(stamp);
    stampEditor.activeStampId=stamp.id;stampEditor.cropMode=false;stampEditor.cropDraft=null;
    invalidateStampPage(pg);closeContentEditor();renderStampOverlays();
    document.querySelector('.stamp-item.active')?.scrollIntoView({block:'nearest',inline:'nearest'});
    return true;
  }catch(e){alert(pt(e.pageEditMessage||'編輯失敗；原頁未套用此變更'));return false;}
}
async function acceptPageClipboard({html='',text='',image=null}) {
  if(!getActiveStampPage() || !stampEditor.pageSize)return;
  const table=parseClipboardTable(html,text);
  if(table){openContentEditor('table',{rows:table.rows});if(table.merged)alert(pt('合併儲存格已展開為一般儲存格；請在套用前檢查。'));return;}
  if(image){
    await runPageTask(async()=>{
      const pg=getActiveStampPage();const data=await fileToDataUrl(image);const img=await loadImage(data);
      if(img.width*img.height>PAGE_EDIT_LIMITS.pixels)throw pageEditError('圖片尺寸過大');
      if(pg!==getActiveStampPage())throw pageEditError('頁面已變更，請重新開啟編輯器');
      const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
      canvas.getContext('2d').drawImage(img,0,0);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      await addImageStamp(new File([blob],pt('剪貼簿圖片')+'.png',{type:'image/png'}));
      const st=getActiveStamp(),size=stampEditor.pageSize;
      const fit=Math.min(1,size.height*.8/st.height);st.width*=fit;st.height*=fit;
      st.y=Math.max(0,size.height-st.height-size.height*.08);renderStampOverlays();
    });return;
  }
  if(text){
    if(text.length>PAGE_EDIT_LIMITS.text)throw pageEditError('資料過大；表格最多 60 列、20 欄，每格 2000 字，文字最多 10000 字。');
    openContentEditor('text',{text});return;
  }
  alert(pt('剪貼簿沒有支援的圖片、文字或表格'));
}
async function pastePageClipboard() {
  if(pageEdit.busy)return;
  try {
    if(!navigator.clipboard?.read)throw Error('unavailable');
    const items=await navigator.clipboard.read();let html='',text='',image=null;
    for(const item of items){
      if(item.types.includes('text/html'))html=await (await item.getType('text/html')).text();
      if(item.types.includes('text/plain'))text=await (await item.getType('text/plain')).text();
      const type=item.types.find(type=>/^image\/(png|jpeg|webp|gif|bmp)$/.test(type));
      if(!image && type)image=await item.getType(type);
    }
    await acceptPageClipboard({html,text,image});
  }catch(e){alert(pt(e.pageEditMessage||'請按 Ctrl+V 貼上；此瀏覽器不允許按鈕讀取剪貼簿。'));}
}
document.addEventListener('paste',async e=>{
  if(!document.getElementById('stamp-overlay').classList.contains('show'))return;
  const field=e.target.closest?.('input,textarea,[contenteditable="true"]');
  if(field && !field.closest('#pe-grid'))return;
  if(pageEdit.busy){e.preventDefault();return;}
  const data=e.clipboardData;if(!data)return;
  const html=data.getData('text/html'),text=data.getData('text/plain');
  try {
    if(field?.closest('#pe-grid')) {
      const table=parseClipboardTable(html,text);if(!table)return;
      e.preventDefault();const d=pageEdit.draft, rows=d.rows.map(r=>[...r]);
      table.rows.forEach((row,r)=>row.forEach((value,c)=>{rows[d.row+r] ||= [];rows[d.row+r][d.col+c]=value;}));
      d.rows=validateRows(rows);renderTableGrid();return;
    }
    if(pageEdit.draft)return;
    e.preventDefault();
    const item=[...data.items].find(item=>item.kind==='file' && /^image\/(png|jpeg|webp|gif|bmp)$/.test(item.type));
    await acceptPageClipboard({html,text,image:item?.getAsFile()});
  }catch(error){e.preventDefault();alert(pt(error.pageEditMessage||'編輯失敗；原頁未套用此變更'));}
});
function togglePageErase() {
  if(!PAGE_ERASURE_ENABLED){setStatus(pt('消去尚未開放；正在驗證保留其他頁文字的刪除引擎。'));return;}
  if(pageEdit.busy || !stampEditor.pageSize)return;
  pageEdit.erase=!pageEdit.erase;pageEdit.start=null;stampEditor.drag=null;stampEditor.resize=null;
  stampEditor.cropMode=false;stampEditor.cropDraft=null;renderStampOverlays();
  document.getElementById('stamp-page-wrap').classList.toggle('erasing',pageEdit.erase);
  document.getElementById('page-erase-box')?.remove();refreshPageEditorLanguage();
  if(pageEdit.erase)setStatus(pt('框選要消去的區域；按 Esc 取消'));
}
function erasePointer(e) {
  const p=stampPointer(e),s=stampEditor.pageSize;
  return {x:Math.max(0,Math.min(s.width,p.sx)),y:Math.max(0,Math.min(s.height,p.sy))};
}
document.getElementById('stamp-page-wrap').addEventListener('mousedown',e=>{
  if(!pageEdit.erase || pageEdit.busy || e.button!==0)return;
  e.preventDefault();e.stopImmediatePropagation();pageEdit.start=erasePointer(e);
  const box=document.createElement('div');box.id='page-erase-box';
  document.getElementById('page-erase-box')?.remove();document.getElementById('stamp-page-wrap').append(box);
},true);
document.addEventListener('mousemove',e=>{
  if(!pageEdit.start)return;
  const p=erasePointer(e),a=pageEdit.start,canvas=document.getElementById('stamp-page-canvas'),s=stampEditor.pageSize;
  const box=document.getElementById('page-erase-box');
  Object.assign(box.style,{left:Math.min(p.x,a.x)*canvas.width/s.width+'px',top:Math.min(p.y,a.y)*canvas.height/s.height+'px',
    width:Math.abs(p.x-a.x)*canvas.width/s.width+'px',height:Math.abs(p.y-a.y)*canvas.height/s.height+'px'});
});
document.addEventListener('mouseup',e=>{
  if(!pageEdit.start)return;
  const p=erasePointer(e),a=pageEdit.start,pg=getActiveStampPage();
  const rect={x:Math.min(a.x,p.x),y:Math.min(a.y,p.y),width:Math.abs(a.x-p.x),height:Math.abs(a.y-p.y)};
  togglePageErase();if(rect.width<2 || rect.height<2)return;
  showModal(pt('確定消去此區域？'),pt('只重建本頁，清除框選區域；本頁文字及表格將定稿。其他頁不轉成圖片。若含不支援的結構或其他頁仍使用原圖片，操作會拒絕。這不是整份文件的個資清理。'),()=>runPageTask(()=>erasePageArea(pg,rect)));
});
async function erasePageArea(pg,rect,keepInside=false,progress=async()=>{}) {
  if(!PAGE_ERASURE_ENABLED)throw pageEditError('消去尚未開放；正在驗證保留其他頁文字的刪除引擎。');
  const index=stampEditor.pageIndex,size=await getPageNaturalSize(pg);
  const originalPages=state.mainPages;
  await progress('正在準備頁面',10);
  await assertErasureSources(originalPages);
  const source=await PDFLib.PDFDocument.create();await appendPageToPdfDocument(source,pg,new Map(),true);
  const originalImages=await pdfImageFingerprints(await PDFLib.PDFDocument.load(await source.save(),{updateMetadata:false}));
  if(![rect.x,rect.y,rect.width,rect.height].every(Number.isFinite) || rect.width<=0 || rect.height<=0)throw Error('Invalid rectangle');
  const scale=Math.min(300/72,Math.sqrt(PAGE_EDIT_LIMITS.pixels/(size.width*size.height)),16000/Math.max(size.width,size.height));
  const canvas=document.createElement('canvas');
  await progress('正在重建裁切區域',35);
  await renderPagePreviewToCanvas(pg,canvas,Math.max(1,Math.round(size.width*scale)));
  await drawStampsOnCanvas(canvas,pg);
  const sx=canvas.width/size.width,sy=canvas.height/size.height;
  const left=Math.max(0,Math.floor(rect.x*sx)),top=Math.max(0,Math.floor(rect.y*sy));
  const right=Math.min(canvas.width,Math.ceil((rect.x+rect.width)*sx)),bottom=Math.min(canvas.height,Math.ceil((rect.y+rect.height)*sy));
  let output=canvas,outputSize=size;
  if(keepInside){
    if(left>=right||top>=bottom||rect.x<0||rect.y<0||rect.x+rect.width>size.width+.01||rect.y+rect.height>size.height+.01)throw Error('Invalid crop');
    output=document.createElement('canvas');output.width=Math.max(1,Math.round(rect.width*sx));output.height=Math.max(1,Math.round(rect.height*sy));
    const ctx=output.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,output.width,output.height);
    ctx.drawImage(canvas,rect.x*sx,rect.y*sy,rect.width*sx,rect.height*sy,0,0,output.width,output.height);
    outputSize={width:rect.width,height:rect.height};
  }else{const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(left,top,right-left,bottom-top);}
  const imageDataUrl=output.toDataURL('image/png');
  const hashes=[...new Set([...originalImages,...originalPages.flatMap(p=>p.erasureImageHashes||[])])];
  // Do not spread the edited pg: never retain its source PDF bytes or objects.
  const replacement={id:pg.id,sourceType:'image',sourcePath:pg.sourcePath,pageIndex:0,
    imageDataUrl,pageSize:{width:outputSize.width,height:outputSize.height},stamps:[],origin:pg.origin,rasterized:true,linkSourceIdentity:pdfLinkIdentity(pg)};
  const candidate=originalPages.map((p,i)=>({... (i===index?replacement:p),requiresResourceCleanup:true,erasureImageHashes:hashes}));
  await progress('正在檢查完整輸出',70);
  const probe=await PDFLib.PDFDocument.create(),cache=new Map();
  for(const p of candidate)await appendPageToPdfDocument(probe,p,cache);
  await saveEditedPdf(probe,candidate); // Validate the entire output before committing any edit.
  if(state.mainPages!==originalPages||state.mainPages[index]!==pg)throw pageEditError('頁面已變更，請重新開啟編輯器');
  snapshotForUndo();state.mainPages=candidate;
  stampEditor.activeStampId=null;invalidateStampPage(state.mainPages[index]);
  await renderStampEditor();setStatus(pt('消去完成；本頁已重新建立'));
}
async function undoPageEdit(isRedo=false) {
  if(pageEdit.busy || documentIO.busy || !(isRedo?redoStack:undoStack).length)return;
  const id=getActiveStampPage()?.id;resetPageEditorTools();isRedo?redo():undo();
  const index=state.mainPages.findIndex(pg=>pg.id===id);
  if(index<0){closeStampEditor();return;}
  state.selectedMain=new Set([index]);stampEditor.pageIndex=index;stampEditor.activeStampId=null;
  refreshMainSelection();await renderStampEditor();refreshPageObjectControls();
}
function handlePageEditorKey(e) {
  if(!document.getElementById('stamp-overlay').classList.contains('show'))return false;
  if(pageEdit.busy){e.preventDefault();return true;}
  if(pageEdit.draft?.kind==='text') {
    if(e.isComposing||e.keyCode===229)return true;
    if(e.key==='Escape'){e.preventDefault();closeContentEditor();return true;}
    if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();applyContentEditor();return true;}
    if((e.ctrlKey||e.metaKey)&&['b','i','u'].includes(e.key.toLowerCase())) {
      e.preventDefault();const id={b:'pe-bold',i:'pe-italic',u:'pe-underline'}[e.key.toLowerCase()];
      const field=document.getElementById(id);field.checked=!field.checked;updateInlineText();
    }return true;
  }
  if(!document.getElementById('page-content-overlay').hidden){
    if(e.key==='Escape'){e.preventDefault();closeContentEditor();}
    if(e.key==='Tab'){
      const nodes=[...document.getElementById('page-content-dialog').querySelectorAll('button,input,textarea')].filter(el=>!el.disabled && el.getClientRects().length);
      const first=nodes[0],last=nodes[nodes.length-1];
      if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
    }return true;
  }
  if(document.getElementById('modal-overlay').classList.contains('show'))return true;
  if(e.target.closest?.('input,textarea,select'))return true;
  if((e.ctrlKey||e.metaKey)&&(e.key.toLowerCase()==='y'||(e.shiftKey&&e.key.toLowerCase()==='z'))){e.preventDefault();undoPageEdit(true);return true;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undoPageEdit();return true;}
  if(e.key==='Escape'){e.preventDefault();if(pageEdit.erase)togglePageErase();else closeStampEditor();return true;}
  if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deleteActiveStamp();refreshPageObjectControls();return true;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='a'){e.preventDefault();return true;}
  return true;
}
document.getElementById('stamp-page-wrap').addEventListener('dblclick',e=>{
  if(pageEraseActive())return;
  const item=e.target.closest('.stamp-item');if(!item)return;
  stampEditor.activeStampId=item.dataset.id;if(getActiveStamp()?.content)editPageObject();
});
document.addEventListener('DOMContentLoaded',refreshPageEditorLanguage);
