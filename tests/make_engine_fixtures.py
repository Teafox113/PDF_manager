"""Synthetic, in-memory image fixtures; never reads user PDF files."""
import base64, io, json, sys
from pathlib import Path
from PIL import Image
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from pdf_engine_bundle import engine_files
image = Image.new('RGB', (16,16), (240,20,30))
buffer = io.BytesIO()
image.save(buffer, format='JPEG2000', irreversible=False)
_, _, resources = engine_files()
print(json.dumps({'jpx':base64.b64encode(buffer.getvalue()).decode(),
                  'icc':base64.b64encode(resources['iccs/CGATS001Compat-v2-micro.icc']).decode()}))
