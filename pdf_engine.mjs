// Development entry point. The offline builder replaces this module with pinned,
// embedded engine/worker/assets; the release never requests these CDN URLs.
import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/build/pdf.mjs';
globalThis.pdfjsLib = pdfjsLib;
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/build/pdf.worker.mjs';
globalThis.pdfManagerEngineOptions = Object.freeze({
  cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/cmaps/',
  standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/standard_fonts/',
  wasmUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/wasm/',
  iccUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/iccs/',
  useWorkerFetch: true,
  disableWorkerRendering: true,
});
globalThis.pdfManagerEngineResolve();
