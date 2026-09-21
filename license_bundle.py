"""Validate and embed the locally archived third-party notices."""
import hashlib
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent
START = '<!-- PDF_MANAGER_LICENSES_BEGIN -->'
END = '<!-- PDF_MANAGER_LICENSES_END -->'


def load_manifest():
    manifest = json.loads((ROOT / 'licenses/manifest.json').read_text(encoding='utf-8'))
    notices = (ROOT / 'THIRD_PARTY_NOTICES.txt').read_bytes()
    if hashlib.sha256(notices).hexdigest() != manifest['notices_sha256']:
        raise ValueError('Third-party notices differ from the reviewed manifest.')
    files = [file for component in manifest['components'] for file in component['files']]
    files.append(manifest['supplement'])
    for entry in files:
        path = (ROOT / entry['path']).resolve()
        if not path.is_relative_to((ROOT / 'licenses').resolve()):
            raise ValueError('License manifest path escapes licenses/.')
        if hashlib.sha256(path.read_bytes()).hexdigest() != entry['sha256']:
            raise ValueError('License file changed: ' + entry['path'])
    return manifest


def verify_bundle(url, code, manifest):
    pin = next((p for p in manifest['bundles'] if p['url'] == url), None)
    if not pin or hashlib.sha256(code.replace('\r\n', '\n').encode('utf-8')).hexdigest() != pin['sha256']:
        raise ValueError('Dependency bytes differ from the licensed version: ' + url)


def embed_notices(document):
    load_manifest()
    if START in document or END in document:
        raise ValueError('Notices already embedded; use the original input.')
    text = (ROOT / 'THIRD_PARTY_NOTICES.txt').read_text(encoding='utf-8')
    dialog = (START + '\n<dialog id="third-party-licenses" style="max-width:90vw;max-height:85vh;overflow:auto;" aria-label="第三方授權">\n'
              '<button type="button" onclick="this.closest(\'dialog\').close()">關閉</button>\n'
              '<h2>第三方授權</h2>\n'
              '<pre style="white-space:pre-wrap;overflow-wrap:anywhere;">' + html.escape(text) + '</pre>\n</dialog>\n' + END + '\n')
    # DOCX rendering templates inside scripts also contain </body> strings.
    # The application document closes after all scripts, at the final body end.
    body_end = document.rfind('</body>')
    if body_end < document.rfind('</script>') or body_end < 0:
        raise ValueError('Expected a document body after the application scripts.')
    document = document[:body_end] + dialog + document[body_end:]
    link = ('\n<a class="about-link" href="#third-party-licenses" '
            'onclick="document.getElementById(\'third-party-licenses\').showModal();return false;">第三方授權</a>')
    document, count = re.subn(r'(<a class="about-link"[^>]*>github\.com/Teafox113</a>)', lambda m: m[0] + link, document, count=1)
    if count != 1:
        raise ValueError('About-panel license link anchor not found.')
    return document
