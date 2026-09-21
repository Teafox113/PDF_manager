import hashlib
import html
import pathlib
import re
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from license_bundle import embed_notices, load_manifest, verify_bundle


class LicenseTests(unittest.TestCase):
    def test_archived_texts_match_manifest(self):
        manifest = load_manifest()
        self.assertEqual(len(manifest['bundles']), 5)
        self.assertEqual(manifest['provisional_decisions'], [])
        component = next(c for c in manifest['components'] if c['name'] == 'dingbat-to-unicode')
        self.assertEqual(component['status'], 'upstream-confirmed')
        self.assertTrue(component['upstream_coverage_confirmed'])
        self.assertIn('Copyright (c) 2021, Michael Williamson', (ROOT/'licenses/dingbat-to-unicode-1.0.1/LICENSE').read_text())
        self.assertIn('5740760399', component['confirmation_url'])

    def test_changed_dependency_is_rejected(self):
        manifest = load_manifest()
        with self.assertRaises(ValueError):
            verify_bundle(manifest['bundles'][0]['url'], 'changed dependency', manifest)

    def test_embed_is_inert_and_lossless(self):
        original = '<html><body><a class="about-link" href="#">github.com/Teafox113</a><script>const docxTemplate="</body></html>";</script></body></html>'
        output = embed_notices(original)
        self.assertEqual(re.findall(r'<script>(.*?)</script>', original), re.findall(r'<script>(.*?)</script>', output))
        content = re.search(r'<pre[^>]*>(.*?)</pre>', output, re.S)[1]
        self.assertEqual(html.unescape(content), (ROOT/'THIRD_PARTY_NOTICES.txt').read_text(encoding='utf-8'))
        with self.assertRaises(ValueError):
            embed_notices(output)

    def test_release_checksum_when_asset_present(self):
        import json
        version = json.loads((ROOT/'version.json').read_text(encoding='utf-8'))['version']
        path = ROOT/f'release-assets/pdf_editor_offline_v{version}.html'
        if not path.exists():
            self.skipTest('Release asset is intentionally not tracked in Git.')
        checksum = next(line.split()[0] for line in (ROOT/'release-assets/SHA256SUMS.txt').read_text().splitlines() if line.endswith(path.name))
        self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest().upper(), checksum)


if __name__ == '__main__':
    unittest.main()
