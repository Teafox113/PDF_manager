"""Build native ESM PDF.js with a minimal file:// classic-worker adapter.

Only public, hash-pinned archives are read. No extraction to arbitrary paths,
package lifecycle scripts, eval, bundler, or user document input is involved.
"""
import base64
import hashlib
import io
import json
import re
from pathlib import Path
import tarfile
import urllib.request

ROOT = Path(__file__).resolve().parent
VERSION = '6.5.438'
ARCHIVES = {
    'pdfjs': ('https://registry.npmjs.org/pdfjs-dist/-/pdfjs-dist-6.5.438.tgz',
              '7461aefcd27c4ef0dd76f9ca5760f09466eb6b3f934432670c12132e7b3d6faa'),
    'fonts': ('https://github.com/liberationfonts/liberation-fonts/files/7261482/liberation-fonts-ttf-2.1.5.tar.gz',
              '7191c669bf38899f73a2094ed00f7b800553364f90e2637010a69c0e268f25d0'),
}


def read_archive(name):
    url, digest = ARCHIVES[name]
    cache = ROOT / 'test-results' / 'dependency-cache' / (digest + '.tgz')
    if cache.exists():
        data = cache.read_bytes()
    else:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'PDF-Manager-build'}), timeout=60) as response:
            data = response.read()
    if hashlib.sha256(data).hexdigest() != digest:
        raise ValueError('Dependency archive integrity mismatch: ' + name)
    if not cache.exists():
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_bytes(data)
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as archive:
        return {m.name: archive.extractfile(m).read() for m in archive.getmembers() if m.isfile()}


def engine_files():
    pdf = read_archive('pdfjs')
    fonts = read_archive('fonts')
    resources = {}
    for name, data in pdf.items():
        relative = name.removeprefix('package/')
        if (relative.startswith('cmaps/') and relative.endswith('.bcmap') or
            relative.startswith('standard_fonts/') and relative.endswith('.pfb') or
            relative in ('wasm/openjpeg.wasm', 'wasm/jbig2.wasm', 'wasm/qcms_bg.wasm',
                         'iccs/CGATS001Compat-v2-micro.icc')):
            resources[relative] = data
    # Ship unmodified OFL 1.1 Liberation 2.1.5 instead of the package's older
    # GPL-font-exception fonts. PDF.js's expected filenames/metrics are retained.
    for style in ('Regular', 'Bold', 'Italic', 'BoldItalic'):
        filename = 'LiberationSans-' + style + '.ttf'
        resources['standard_fonts/' + filename] = fonts['liberation-fonts-ttf-2.1.5/' + filename]
    return pdf, fonts, resources


def build_engine():
    pdf, _, resources = engine_files()
    inventory = json.loads((ROOT / 'licenses/pdfjs-resources.json').read_text(encoding='utf-8'))
    actual = {k: hashlib.sha256(v).hexdigest() for k, v in sorted(resources.items())}
    if actual != inventory['resources']:
        raise ValueError('PDF.js resource inventory differs from reviewed licenses.')
    worker_module = pdf['package/build/pdf.worker.min.mjs'].decode('utf-8')
    # Chromium blocks module-worker imports from file:// opaque origins. Adapt
    # only the final export declaration for a classic Blob worker; keep parser
    # and decoder implementations untouched. Fail closed if upstream changes.
    worker_module, count = re.subn(r'export\{WorkerMessageHandler\};', '', worker_module)
    if count != 1:
        raise ValueError('Unrecognized PDF.js worker export; review adaptation.')
    if worker_module.count('import.meta.url') != 2:
        raise ValueError('Unrecognized decoder module URLs; review adaptation.')
    worker_module = worker_module.replace('import.meta.url', 'self.location.href')
    worker = ('const PDF_MANAGER_RESOURCES = ' + json.dumps({k: base64.b64encode(v).decode('ascii') for k, v in sorted(resources.items())}) + ';\n' +
              (ROOT / 'pdf_worker_resources.js').read_text(encoding='utf-8') + '\n' +
              worker_module)
    main = pdf['package/build/pdf.min.mjs'].decode('utf-8')
    # Main ESM is intact; worker adaptation is limited to export/import.meta.
    code = '''
const engineBlob = code => URL.createObjectURL(new Blob([code], {type:'text/javascript'}));
const mainUrl = engineBlob(MAIN_CODE);
try {
  globalThis.pdfjsLib = await import(mainUrl);
  globalThis.pdfManagerWorkerSource = engineBlob(WORKER_CODE);
  globalThis.pdfManagerEngineOptions = Object.freeze({
    cMapUrl:'pdf-manager-resource:///cmaps/',
    standardFontDataUrl:'pdf-manager-resource:///standard_fonts/',
    wasmUrl:'pdf-manager-resource:///wasm/', iccUrl:'pdf-manager-resource:///iccs/',
    cMapPacked:true, useWorkerFetch:true, useWasm:true, useSystemFonts:false,
    disableWorkerRendering:true
  });
  globalThis.pdfManagerEngineResolve();
} catch(error) {
  globalThis.pdfManagerEngineReject(error);
  console.error('PDF engine initialization failed', error);
  alert('PDF 引擎無法啟動。請使用最新版 Chrome／Edge。 PDF engine could not start. Use current Chrome/Edge.');
  throw error;
} finally { URL.revokeObjectURL(mainUrl); }
'''.replace('MAIN_CODE', json.dumps(main)).replace('WORKER_CODE', json.dumps(worker))
    return '<script type="module">\n' + code.replace('</script', '<\\/script') + '\n</script>'
