import { useEffect, useState } from 'react';

const PDFJS_VERSION = '4.4.168';

type PdfJsModule = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: string) => { promise: Promise<PdfDocument> };
};

type PdfDocument = {
  numPages: number;
  getPage: (n: number) => Promise<PdfPage>;
};

type PdfPage = {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (opts: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
    canvas?: HTMLCanvasElement;
  }) => { promise: Promise<void> };
};

let pdfjsPromise: Promise<PdfJsModule> | null = null;

function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import(
      /* @vite-ignore */
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.mjs`
    ).then((lib: PdfJsModule) => {
      lib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
      return lib;
    });
  }
  return pdfjsPromise;
}

type PdfViewerProps = {
  url: string;
  className?: string;
};

export function PdfViewer({ url, className }: PdfViewerProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderPdf() {
      setLoading(true);
      setError(null);
      setPages([]);

      try {
        const pdfjs = await loadPdfJs();
        const doc = await pdfjs.getDocument(url).promise;
        const images: string[] = [];

        for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
          if (cancelled) return;
          const page = await doc.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas not supported');

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          images.push(canvas.toDataURL('image/jpeg', 0.92));
        }

        if (!cancelled) {
          setPages(images);
        }
      } catch {
        if (!cancelled) {
          setError('Unable to display the PDF here.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void renderPdf();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) {
    return (
      <div className={`flex min-h-[60vh] items-center justify-center bg-paper ${className ?? ''}`}>
        <p className="text-sm text-black/45">Loading PDF…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex min-h-[40vh] items-center justify-center bg-paper px-6 text-center ${className ?? ''}`}>
        <p className="text-sm text-black/55">{error}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 bg-paper p-4 ${className ?? ''}`}>
      {pages.map((src, index) => (
        <img
          key={index}
          src={src}
          alt={`Page ${index + 1}`}
          className="mx-auto block w-full max-w-4xl shadow-md"
          loading={index === 0 ? 'eager' : 'lazy'}
        />
      ))}
    </div>
  );
}
