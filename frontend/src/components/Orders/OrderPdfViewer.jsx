import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

export default function OrderPdfViewer({ url, blob, title = 'PDF' }) {
  const mobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!mobileDevice && navigator.pdfViewerEnabled !== false) {
    return <iframe src={url} title={title} className="file-preview-frame" />;
  }
  return <ScrollablePdf blob={blob} />;
}

function ScrollablePdf({ blob }) {
  const pages = useRef(null);
  const [progress, setProgress] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = pages.current;
    let active = true;
    let renderTask;
    setProgress(null);
    setFailed(false);
    let task;

    async function renderPages() {
      const data = new Uint8Array(await blob.arrayBuffer());
      if (!active) return;
      task = getDocument({ data, isEvalSupported: false });
      const pdf = await task.promise;
      for (let number = 1; active && number <= pdf.numPages; number++) {
        const page = await pdf.getPage(number);
        if (!active) return;
        const natural = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(1.6, 1200 / Math.max(natural.width, natural.height)) });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', 'Сторінка ' + number);
        canvas.style.cssText = 'display:block;max-width:100%;height:auto;margin:0 auto 8px;background:white';
        renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport });
        await renderTask.promise;
        if (!active) return;
        container.appendChild(canvas);
        page.cleanup();
        setProgress({ rendered: number, total: pdf.numPages });
      }
    }

    renderPages().catch(() => {
      if (active) setFailed(true);
    });
    return () => {
      active = false;
      renderTask?.cancel();
      task?.destroy().catch(() => {});
      container.replaceChildren();
    };
  }, [blob]);

  return (
    <div style={{ width: '100%', minWidth: 0, height: '100%', overflow: 'auto' }}>
      {!progress && !failed && <p role="status">Завантажуємо PDF…</p>}
      <div ref={pages} />
      {progress && progress.rendered < progress.total && !failed && (
        <p role="status">Завантажено сторінок {progress.rendered} із {progress.total}…</p>
      )}
      {failed && <p role="alert">Не вдалося відобразити PDF повністю.</p>}
    </div>
  );
}
