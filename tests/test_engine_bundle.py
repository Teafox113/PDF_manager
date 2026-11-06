import hashlib, json, pathlib, sys, unittest
from unittest.mock import patch
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from pdf_engine_bundle import engine_files, build_engine

class EngineBundleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.files=engine_files()

    def test_complete_resource_inventory(self):
        pdf,fonts,resources=self.files
        inventory=json.loads((ROOT/'licenses/pdfjs-resources.json').read_text())
        self.assertEqual(inventory['engine_version'],'6.5.438')
        self.assertEqual(inventory['resources'],{k:hashlib.sha256(v).hexdigest() for k,v in resources.items()})
        self.assertGreater(len([k for k in resources if k.endswith('.bcmap')]),150)
        self.assertEqual(len([k for k in resources if k.endswith('.ttf')]),4)
        self.assertEqual(len([k for k in resources if k.endswith('.wasm')]),3)
        self.assertFalse(any('quickjs' in k.lower() for k in resources))
        self.assertIn(b'SIL OPEN FONT LICENSE',fonts['liberation-fonts-ttf-2.1.5/LICENSE'])

    def test_modified_resource_rejected(self):
        pdf,fonts,resources=self.files
        with patch('pdf_engine_bundle.engine_files',return_value=(pdf,fonts,{**resources,'wasm/jbig2.wasm':b'altered'})):
            with self.assertRaisesRegex(ValueError,'inventory'):
                build_engine()

    def test_unrecognized_worker_rejected(self):
        pdf,fonts,resources=self.files
        modified={**pdf,'package/build/pdf.worker.min.mjs':b'export { changed };'}
        with patch('pdf_engine_bundle.engine_files',return_value=(modified,fonts,resources)):
            with self.assertRaisesRegex(ValueError,'worker export'):
                build_engine()

if __name__=='__main__':unittest.main()
