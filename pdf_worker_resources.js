// Project-owned adapter prepended to the unmodified PDF.js worker module.
// PDF_MANAGER_RESOURCES is generated from integrity-checked public packages.
// No network fallback: only exact, packaged resource identifiers are accepted.
const pdfManagerResourcePrefix = 'pdf-manager-resource:///';
function pdfManagerResourceBytes(url) {
  const key = String(url);
  if (!key.startsWith(pdfManagerResourcePrefix)) throw new Error('External worker resource blocked.');
  const name = key.slice(pdfManagerResourcePrefix.length);
  if (!Object.hasOwn(PDF_MANAGER_RESOURCES, name)) throw new Error('Offline resource missing: ' + name);
  return Uint8Array.from(atob(PDF_MANAGER_RESOURCES[name]), c => c.charCodeAt(0));
}
globalThis.fetch = async function(url, options) {
  if (options?.method && options.method !== 'GET') throw new Error('Only local resource reads are allowed.');
  return new Response(pdfManagerResourceBytes(url));
};
// PDF.js ICC initialization uses synchronous XHR. Serve the same immutable bytes
// from memory, without granting connect-src or permitting native XHR fallback.
globalThis.XMLHttpRequest = class {
  open(method, url, async) {
    if (method !== 'GET' || async !== false) throw new Error('Unsupported resource request.');
    this.resourceUrl = url;
  }
  send(body) {
    if (body != null || this.responseType !== 'arraybuffer') throw new Error('Unsupported resource response.');
    this.response = pdfManagerResourceBytes(this.resourceUrl).buffer;
    this.status = 200;
  }
};
