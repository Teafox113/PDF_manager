// Synthetic fixtures only. Optional local PDF: PDF_MANAGER_TEST_PDF (never copied).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'))).version;
const asset = process.env.PDF_MANAGER_ASSET || path.join(root, `release-assets/pdf_editor_offline_v${version}.html`);

(async () => {
  const browser = await chromium.launch({channel: process.env.BROWSER_CHANNEL || 'chrome', headless:true});
  try {
    const context = await browser.newContext({offline:true, viewport:{width:1440,height:1900}});
    const page = await context.newPage();
    const errors=[], external=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
    await page.goto(pathToFileURL(asset).href);
    const cases = [0,90,180,270].flatMap(rotation=>[false,true].map(crop=>({rotation,crop})));
    if (process.env.PDF_MANAGER_TEST_PDF) cases.push({local:true});
    for (const spec of cases) {
      const previousId=await page.evaluate(()=>state.mainPages[0]?.id || null);
      if (spec.local) await page.locator('#file-main').setInputFiles(process.env.PDF_MANAGER_TEST_PDF);
      else {
        const bytes=await page.evaluate(async ({rotation,crop})=>{
          const doc=await PDFLib.PDFDocument.create(); const p=doc.addPage([842.04,595.44]);
          p.drawText('VECTOR CONTENT RETAINED',{x:100,y:250,size:15});
          p.setRotation(PDFLib.degrees(rotation));
          if(crop)p.setCropBox(50,35,700,490);
          return Array.from(await doc.save());
        },spec);
        await page.locator('#file-main').setInputFiles({name:'synthetic.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)});
      }
      await page.waitForFunction(previousId=>state.mainPages.length===1 && state.mainPages[0].id!==previousId && document.querySelector('#left-thumbs canvas'),previousId);
      await page.locator('#left-thumbs .thumb-card').first().click();
      await page.locator('#btn-stamp').click();
      await page.waitForFunction(()=>document.getElementById('stamp-overlay').classList.contains('show') && stampEditor.pageSize);
      const png=await page.evaluate(()=>{
        const c=document.createElement('canvas');c.width=120;c.height=60;
        const ctx=c.getContext('2d');ctx.fillStyle='red';ctx.fillRect(0,0,60,60);ctx.fillStyle='blue';ctx.fillRect(60,0,60,60);
        return c.toDataURL().split(',')[1];
      });
      await page.locator('#file-stamp').setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
      await page.waitForFunction(()=>document.querySelector('.stamp-item'));
      const box=await page.locator('.stamp-item').boundingBox();
      // A 55-screen-pixel move must stay under the pointer despite body zoom=1.1.
      await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
      await page.mouse.move(box.x+box.width/2+55,box.y+box.height/2+55,{steps:5});await page.mouse.up();
      const moved=await page.locator('.stamp-item').boundingBox();
      assert.ok(Math.abs(moved.x-box.x-55)<2,'zoom X');assert.ok(Math.abs(moved.y-box.y-55)<2,'zoom Y');
      await page.mouse.move(moved.x+moved.width/2,moved.y+moved.height/2);await page.mouse.down();
      await page.mouse.move(moved.x+moved.width/2,1850,{steps:20});await page.mouse.up();
      const bounds=await page.evaluate(()=>{
        const c=document.getElementById('stamp-page-canvas').getBoundingClientRect();
        const s=document.querySelector('.stamp-item').getBoundingClientRect();
        return {y:getActiveStamp().y,bottomGap:c.bottom-s.bottom};
      });
      assert.equal(bounds.y,0);assert.ok(Math.abs(bounds.bottomGap)<2,JSON.stringify(bounds));
      if(spec.rotation===90 && spec.crop){
        await page.setViewportSize({width:900,height:700});
        await page.evaluate(()=>{getActiveStamp().y=stampEditor.pageSize.height/2;renderStampOverlays();});
        await page.locator('.stamp-item').scrollIntoViewIfNeeded();
        const b=await page.locator('.stamp-item').boundingBox();
        await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();
        const before=await page.evaluate(()=>({y:getActiveStamp().y,scroll:document.getElementById('stamp-work').scrollTop,
          ratio:stampEditor.pageSize.height/document.getElementById('stamp-page-canvas').getBoundingClientRect().height,
          zoom:parseFloat(getComputedStyle(document.body).zoom)}));
        await page.evaluate(()=>{document.getElementById('stamp-work').scrollTop+=40;});
        await page.mouse.move(b.x+b.width/2,b.y+b.height/2+20);await page.mouse.up();
        const after=await page.evaluate(()=>({y:getActiveStamp().y,scroll:document.getElementById('stamp-work').scrollTop}));
        assert.ok(Math.abs(before.y-after.y-(20+(after.scroll-before.scroll)*before.zoom)*before.ratio)<1,'scroll-aware dragging');
        await page.locator('.stamp-handle.se').scrollIntoViewIfNeeded();
        const handle=await page.locator('.stamp-handle.se').boundingBox();
        const widthBefore=await page.evaluate(()=>getActiveStamp().width);
        await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);await page.mouse.down();
        await page.mouse.move(handle.x+handle.width/2+22,handle.y+handle.height/2+11);await page.mouse.up();
        const resized=await page.evaluate(()=>({w:getActiveStamp().width,h:getActiveStamp().height}));
        assert.ok(resized.w>widthBefore,JSON.stringify({resized,widthBefore,handle}));assert.ok(Math.abs(resized.w/resized.h-2)<0.001);
        await page.setViewportSize({width:1440,height:1900});
        await page.evaluate(()=>{getActiveStamp().y=0;renderStampOverlays();});
      }
      const capture=spec.rotation===90 && spec.crop;
      const result=await page.evaluate(async capture=>{
        const pg=getActiveStampPage();const st=getActiveStamp();
        // Compare raster and vector-PDF stamps on the same rotated target.
        const stampDoc=await PDFLib.PDFDocument.create();const sp=stampDoc.addPage([120,60]);
        sp.drawRectangle({x:0,y:0,width:60,height:60,color:PDFLib.rgb(1,0,0)});
        sp.drawRectangle({x:60,y:0,width:60,height:60,color:PDFLib.rgb(0,0,1)});
        const stampBytes=await stampDoc.save();
        const vector={...st,id:uid(),type:'pdf_page',pdfBytes:stampBytes,pageIndex:0,
          naturalW:120,naturalH:60,previewDataUrl:st.imageDataUrl,x:st.x+st.width+25,y:30};
        pg.stamps.push(vector);
        const expected=document.createElement('canvas');
        await renderPagePreviewToCanvas(pg,expected,600);await drawStampsOnCanvas(expected,pg);
        const out=await PDFLib.PDFDocument.create();await appendPageToPdfDocument(out,pg,new Map());
        const bytes=await out.save();const rendered=document.createElement('canvas');
        await renderPdfPageToCanvasAtWidth(bytes,0,rendered,600);
        const pdf=await pdfjsLib.getDocument({data:bytes.slice()}).promise;const p=await pdf.getPage(1);
        const text=(await p.getTextContent()).items.map(x=>x.str).join(' ');
        function colors(c) {
          const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
          const sums=[{n:0,x:0,y:0},{n:0,x:0,y:0}];
          for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
            const i=(y*c.width+x)*4;const [r,g,b]=data.slice(i,i+3);
            const k=r>220&&g<35&&b<35?0:b>220&&r<35&&g<35?1:-1;
            if(k>=0){sums[k].n++;sums[k].x+=x;sums[k].y+=y;}
          }
          return sums.map(s=>({n:s.n,x:s.x/s.n,y:s.y/s.n}));
        }
        return {expected:colors(expected),actual:colors(rendered),textPreserved:text.includes('VECTOR CONTENT RETAINED'),
          renderedPng:capture?rendered.toDataURL().split(',')[1]:null};
      },capture);
      for(let i=0;i<2;i++){
        const a=result.actual[i],e=result.expected[i];
        assert.ok(e.n>100);assert.ok(Math.abs(a.x-e.x)<2 && Math.abs(a.y-e.y)<2,JSON.stringify({spec,a,e}));
        assert.ok(Math.abs(a.n/e.n-1)<0.04,JSON.stringify({spec,a,e}));
      }
      if(!spec.local)assert.ok(result.textPreserved,'target text must remain selectable');
      if(spec.rotation===90 && spec.crop){
        await page.evaluate(()=>renderStampOverlays());
        fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
        fs.writeFileSync(path.join(root,'test-results/stamp-export.png'),Buffer.from(result.renderedPng,'base64'));
        await page.screenshot({path:path.join(root,'test-results/stamp-rotation.png')});
      }
      await page.evaluate(()=>closeStampEditor());
      console.log('PASS',spec.local?'local PDF (path/content omitted)':JSON.stringify(spec));
    }
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    console.log('PASS: geometry, pointer movement, bottom edge, raster/vector export, retained text; offline with no page errors.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
