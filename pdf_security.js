/* Project-owned PDF.js entry point. Keep document parsing local and non-evaluating. */
'use strict';
// Native module evaluation may finish after window.load; gate early file drops.
globalThis.pdfManagerEngineReady = new Promise((resolve, reject) => {
  globalThis.pdfManagerEngineResolve = resolve;
  globalThis.pdfManagerEngineReject = reject;
});
globalThis.pdfManagerEngineReady.catch(() => {});

// Engine 6.x is actually upgraded; retain defense-in-depth (no PDF scripting,
// XFA or caller-supplied options). Resource options come only from our bootstrap.
function loadLocalPdf(data) {
  if (!(data instanceof Uint8Array) && !(data instanceof ArrayBuffer)) {
    throw new TypeError('PDF input must be local bytes.');
  }
  if (!globalThis.pdfjsLib) {
    return { promise: globalThis.pdfManagerEngineReady.then(() => loadLocalPdf(data).promise) };
  }
  const port = globalThis.pdfManagerWorkerSource ? new Worker(globalThis.pdfManagerWorkerSource) : null;
  if (port) {
    // Wait for the worker's real ready handshake. Fail promptly on CSP/syntax
    // errors instead of hanging or falling back to parsing on the UI thread.
    const ready = new Promise((resolve, reject) => {
      const timer = setTimeout(() => fail(new Error('PDF worker startup timed out.')), 15000);
      const fail = error => { clearTimeout(timer); port.terminate(); reject(error); };
      port.addEventListener('error', () => fail(new Error('PDF worker could not start. Please use current Chrome/Edge.')), {once:true});
      port.addEventListener('message', event => {
        if (event.data?.action === 'ready') { clearTimeout(timer); resolve(); }
      }, {once:true});
    });
    return {promise: ready.then(() => startLocalPdf(data, port).promise)};
  }
  return startLocalPdf(data, null);
}

function startLocalPdf(data, port) {
  const worker = port ? new pdfjsLib.PDFWorker({port}) : undefined;
  const task = pdfjsLib.getDocument({
    ...globalThis.pdfManagerEngineOptions,
    data,
    worker,
    isEvalSupported: false,
    enableXfa: false,
  });
  if (worker) {
    // getDocument does not own explicitly supplied workers. Release both sides
    // on success, rejected input and cancellation instead of leaking threads.
    const destroy = task.destroy.bind(task);
    task.pdfManagerWorker = worker;
    task.destroy = async () => {
      try { await destroy(); } finally { worker.destroy(); port.terminate(); }
    };
    port.addEventListener('error', () => { task.destroy().catch(() => {}); }, {once:true});
    task.promise.catch(() => task.destroy().catch(() => {}));
  }
  return task;
}
