"""Read-only upstream snapshot and offline packaging; never modifies upstream."""
import argparse, base64, hashlib, json, re, shutil
from pathlib import Path

root=Path(__file__).resolve().parent
p=argparse.ArgumentParser()
p.add_argument('upstream',type=Path)
p.add_argument('--build-id',default='20261112',help='Unique offline build identifier; existing outputs are never overwritten')
args=p.parse_args()
up=args.upstream.resolve()
version=json.loads((up/'extension/manifest.json').read_text(encoding='utf-8'))['version']
if not re.fullmatch(r'[A-Za-z0-9-]+',args.build_id):raise ValueError('Invalid build identifier')
label=version+'-offline-'+args.build_id
out=root/'release-assets'/('vulpedit_'+label+'.html')
snapshot=root/'sync-snapshots'/label
if out.exists() or snapshot.exists():raise SystemExit('Refusing to overwrite an existing snapshot/artifact')
pins=json.loads((up/'vendor/integrity.json').read_text(encoding='utf-8'))
for name,pin in pins.items():
 if hashlib.sha256((up/'vendor'/name).read_bytes()).hexdigest()!=pin['sha256']:raise ValueError('Vendor hash mismatch: '+name)
document=(up/'src/pdf_editor.html').read_text(encoding='utf-8')
sources={}
def read(relative):
 path=(up/relative).resolve()
 if not path.is_relative_to(up):raise ValueError('Path escape')
 data=path.read_bytes();sources[relative]=data
 return data.decode('utf-8')
engine=read('src/pdf_engine.mjs')
main=read('vendor/pdf.min.mjs');worker=read('vendor/pdf.worker.js')
engine=engine.replace("await import('./vendor/pdf.min.mjs')",'await import(URL.createObjectURL(new Blob(['+json.dumps(main)+'],{type:"text/javascript"})))')
engine=engine.replace("new URL('./vendor/pdf.worker.js', import.meta.url).href",'URL.createObjectURL(new Blob(['+json.dumps(worker)+'],{type:"text/javascript"}))')
engine=engine.replace('重新載入擴充功能','重新開啟離線檔').replace('Reload the extension.','Reopen the offline file.')
def script(m):
 name=m[2]
 code=engine if name=='pdf_engine.mjs' else read(name if name.startswith('vendor/') else 'src/'+name)
 return '<script'+(' type="module"' if name=='pdf_engine.mjs' else '')+'>'+code.replace('</script','<\\/script')+'</script>'
document=re.sub(r'<script([^>]*?)src="([^"]+)"[^>]*></script>',script,document)
document=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+read('src/'+m[1])+'</style>',document)
icon=(up/'extension/icons/icon32.png').read_bytes();sources['extension/icons/icon32.png']=icon
document=document.replace('href="icons/icon32.png"','href="data:image/png;base64,'+base64.b64encode(icon).decode()+'"')
terms=read('extension/terms.html')
document=document.replace('href="terms.html" target="_blank" rel="noopener"','href="#offline-terms" onclick="document.getElementById(\'offline-terms\').showModal();return false;"')
import html
terms_dialog='<dialog id="offline-terms"><button onclick="this.parentElement.close()">關閉 / Close</button><iframe style="width:80vw;height:75vh" sandbox srcdoc="'+html.escape(terms,quote=True)+'"></iframe></dialog>'
body_end=document.rfind('</body>')
if body_end<document.rfind('</script>'):raise ValueError('Expected final document body')
document=document[:body_end]+terms_dialog+document[body_end:]
document=re.sub(r'<a class="about-link" href="mailto:[^"]+">[^<]+</a>','<a class="about-link" href="https://github.com/Teafox113/PDF_manager/issues" target="_blank" rel="noopener noreferrer">Contact: GitHub Issues</a>',document)
csp="default-src 'self' data: blob: file:; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:; worker-src blob:; connect-src 'none'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'; form-action 'none';"
document=document.replace('<meta charset="UTF-8">','<meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="'+csp+'">',1)
document='<!-- Vulpedit '+label+'; local offline test build, upstream '+version+' -->\n'+document
for name in ['LICENSE.txt','extension/CHROME_MODIFICATIONS.txt','src/THIRD_PARTY_NOTICES.txt','src/pdf_editor.html','extension/manifest.json','vendor/integrity.json','docs/TEST_REPORT.md']:
 read(name)
document+='\n<!-- Upstream modification and license notices -->\n<pre hidden>'+html.escape(sources['extension/CHROME_MODIFICATIONS.txt'].decode())+'\n'+html.escape(sources['LICENSE.txt'].decode())+'</pre>'
for name,data in sources.items():
 target=snapshot/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
report={'upstream_version':version,'offline_version':label,'files':{n:hashlib.sha256(d).hexdigest() for n,d in sources.items()},'adaptations':['inline local scripts/styles/assets','Blob ESM and real worker','offline terms dialog','Issues contact instead of email','offline CSP; no extension permissions']}
out.write_text(document,encoding='utf-8',newline='\n')
report['artifact_sha256']=hashlib.sha256(out.read_bytes()).hexdigest()
(snapshot/'SYNC.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'artifact':str(out),'sha256':report['artifact_sha256'],'snapshot_files':len(sources)}))
