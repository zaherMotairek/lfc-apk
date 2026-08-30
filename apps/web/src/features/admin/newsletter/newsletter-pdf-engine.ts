const PDF_URL = '/newsletter/issue01-reference.pdf';
const PDFJS_VERSION = '4.4.168';
const CACHE_KEY = 'kop-redleb-pdf-backgrounds-v1';

export type NewsletterBackgrounds = {
  cover: string;
  inner: string;
  memorial: string;
  footerStrip: string;
};

type PdfJsModule = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: string) => { promise: Promise<PdfDocument> };
};

type PdfDocument = {
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
let pdfDocPromise: Promise<PdfDocument> | null = null;

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

async function getPdfDoc(): Promise<PdfDocument> {
  if (!pdfDocPromise) {
    const pdfjs = await loadPdfJs();
    pdfDocPromise = pdfjs.getDocument(PDF_URL).promise;
  }
  return pdfDocPromise;
}

async function renderPageCanvas(pageNumber: number, scale = 2.5): Promise<HTMLCanvasElement> {
  const doc = await getPdfDoc();
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return canvas;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.93): string {
  return canvas.toDataURL('image/jpeg', quality);
}

function cropCanvas(source: HTMLCanvasElement, y: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(source, 0, y, source.width, height, 0, 0, source.width, height);
  return canvas;
}

function readCache(): NewsletterBackgrounds | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as NewsletterBackgrounds;
  } catch {
    return null;
  }
}

function writeCache(bg: NewsletterBackgrounds) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(bg));
  } catch {
    /* quota — backgrounds will re-render next time */
  }
}

/** Renders exact page backgrounds from the official Issue 01 PDF. */
export async function loadNewsletterBackgrounds(): Promise<NewsletterBackgrounds> {
  const cached = readCache();
  if (cached) return cached;

  const [coverCanvas, innerCanvas, memorialCanvas] = await Promise.all([
    renderPageCanvas(1),
    renderPageCanvas(2),
    renderPageCanvas(9),
  ]);

  const footerHeight = Math.round(innerCanvas.height * 0.048);
  const footerStripCanvas = cropCanvas(
    innerCanvas,
    innerCanvas.height - footerHeight,
    footerHeight,
  );

  const backgrounds: NewsletterBackgrounds = {
    cover: canvasToJpeg(coverCanvas),
    inner: canvasToJpeg(innerCanvas),
    memorial: canvasToJpeg(memorialCanvas),
    footerStrip: canvasToJpeg(footerStripCanvas),
  };

  writeCache(backgrounds);
  return backgrounds;
}

export function preloadNewsletterBackgrounds() {
  void loadNewsletterBackgrounds();
}
