import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { useConfirm } from '../../components/ui/confirm-provider';
import { useAuth } from '../auth/auth-context';
import { apiUploadFile } from '../../lib/api';
import { RedlebDispatch } from './newsletter/redleb-dispatch';
import { REDLEB_DISPATCH_CSS } from './newsletter/newsletter-styles';
import { AdminNewsletterPublish } from './admin-newsletter-publish';
import {
  createEmptyNewsletter,
  emptyPhoto,
  newId,
  type NewsletterData,
  type NewsletterNewsBlock,
  type NewsletterPhoto,
} from './newsletter/newsletter-types';

const STORAGE_KEY = 'kop-redleb-dispatch-draft';

async function compressImageFile(file: File, maxWidth = 1600): Promise<File> {
  if (!file.type.startsWith('image/') || file.size < 400_000) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.85);
  });
  if (!blob) return file;

  const base = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
}

function readPhotoAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Unable to read photo'));
    reader.readAsDataURL(file);
  });
}

function stripDataUrlPhotos(data: NewsletterData): NewsletterData {
  const strip = (url: string) => (url.startsWith('data:') ? '' : url);
  return {
    ...data,
    seasonReview: {
      ...data.seasonReview,
      photos: data.seasonReview.photos.map((p) => ({ ...p, url: strip(p.url) })),
    },
    clubNews: data.clubNews.map((block) => ({
      ...block,
      photos: block.photos.map((p) => ({ ...p, url: strip(p.url) })),
    })),
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      className="kop-input"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function TextArea({
  value,
  onChange,
  rows = 6,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      className="kop-input min-h-28"
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function PhotoFields({
  photos,
  onChange,
  accessToken,
  onError,
}: {
  photos: NewsletterPhoto[];
  onChange: (photos: NewsletterPhoto[]) => void;
  accessToken: string | null;
  onError: (message: string) => void;
}) {
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const slotInputRef = useRef<HTMLInputElement>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const pendingSlotRef = useRef<number | null>(null);

  async function uploadOne(file: File): Promise<string> {
    const prepared = await compressImageFile(file);
    if (accessToken) {
      try {
        const result = await apiUploadFile<{ url: string }>(
          '/admin/newsletter/upload-image',
          prepared,
          accessToken,
        );
        return result.url;
      } catch (err) {
        onError(
          err instanceof Error
            ? `${err.message} — using local preview only for this photo.`
            : 'Upload failed — using local preview.',
        );
      }
    }
    return readPhotoAsDataUrl(prepared);
  }

  async function assignUrl(index: number, url: string) {
    const next = [...photos];
    next[index] = { ...next[index], url };
    onChange(next);
  }

  async function handleFiles(files: FileList | null, startIndex?: number) {
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!list.length) {
      onError('Please choose image files (JPG, PNG, WebP).');
      return;
    }

    if (startIndex !== undefined) {
      setUploadingIndex(startIndex);
      try {
        const url = await uploadOne(list[0]);
        await assignUrl(startIndex, url);
      } finally {
        setUploadingIndex(null);
      }
      return;
    }

    setUploadingBulk(true);
    const next = [...photos];
    try {
      for (const file of list) {
        const url = await uploadOne(file);
        const emptyIndex = next.findIndex((p) => !p.url);
        if (emptyIndex >= 0) {
          next[emptyIndex] = { ...next[emptyIndex], url };
        } else {
          next.push({ url, caption: '' });
        }
      }
      onChange(next);
    } finally {
      setUploadingBulk(false);
    }
  }

  function triggerSlotUpload(index: number) {
    pendingSlotRef.current = index;
    slotInputRef.current?.click();
  }

  return (
    <div className="space-y-3">
      <input
        ref={bulkInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={slotInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const index = pendingSlotRef.current;
          if (index !== null) {
            void handleFiles(e.target.files, index);
          }
          pendingSlotRef.current = null;
          e.target.value = '';
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="kop-btn-primary !py-2 !text-xs"
          disabled={uploadingBulk}
          onClick={() => bulkInputRef.current?.click()}
        >
          {uploadingBulk ? 'Uploading…' : 'Upload photos'}
        </button>
        <span className="text-xs text-black/50">JPG, PNG · max 8 MB · saved on server when logged in</span>
      </div>

      {photos.map((photo, index) => (
        <div
          key={`photo-${index}`}
          className="grid gap-2 rounded-xl border border-black/10 bg-white p-3 md:grid-cols-[96px_1fr_auto_auto]"
        >
          <button
            type="button"
            className="h-20 overflow-hidden rounded-lg bg-black/5 text-left"
            onClick={() => triggerSlotUpload(index)}
            title="Click to upload or replace"
          >
            {photo.url ? (
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-widest text-black/35">
                <span>{uploadingIndex === index ? '…' : '+'}</span>
                <span>Photo</span>
              </div>
            )}
          </button>
          <input
            className="kop-input"
            placeholder="Caption"
            value={photo.caption}
            onChange={(e) => {
              const next = [...photos];
              next[index] = { ...photo, caption: e.target.value };
              onChange(next);
            }}
          />
          <button
            type="button"
            className="kop-btn-secondary !py-2 !text-xs"
            disabled={uploadingIndex === index}
            onClick={() => triggerSlotUpload(index)}
          >
            {uploadingIndex === index ? '…' : photo.url ? 'Replace' : 'Upload'}
          </button>
          <button
            type="button"
            className="kop-btn-secondary !py-2 !text-xs"
            onClick={() => onChange(photos.filter((_, i) => i !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="kop-btn-secondary !py-2 !text-xs"
        onClick={() => onChange([...photos, emptyPhoto()])}
      >
        + Photo slot
      </button>
    </div>
  );
}

export function AdminNewsletterPage() {
  const { accessToken } = useAuth();
  const confirm = useConfirm();
  const [data, setData] = useState<NewsletterData>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as NewsletterData;
    } catch {
      /* ignore */
    }
    return createEmptyNewsletter(2);
  });
  const [previewOpen, setPreviewOpen] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const toSave = stripDataUrlPhotos(data);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      /* quota — text still editable this session */
    }
  }, [data]);

  const pageCount = useMemo(() => {
    let n = 2;
    if (data.seasonReview.enabled) n += 1;
    n += data.clubNews.filter((b) => b.title || b.body || b.photos.some((p) => p.url)).length;
    if (data.onThePitch.enabled) n += 1;
    if (data.memorial.enabled && data.memorial.name) n += 1;
    return n;
  }, [data]);

  function generatePdf() {
    const root = document.getElementById('redleb-dispatch-print');
    if (!root) {
      setMessage('Preview is not ready yet.');
      return;
    }
    const imgs = root.querySelectorAll('img.rd-page-bg');
    const pending = Array.from(imgs).filter((img) => !(img as HTMLImageElement).complete);
    if (pending.length) {
      setMessage('Template is still loading from PDF — wait a few seconds and try again.');
      return;
    }
    const win = window.open('', '_blank', 'width=900,height=1200');
    if (!win) {
      setMessage('Allow pop-ups, then click Done again. In the print dialog choose Save as PDF.');
      return;
    }
    win.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>RedLeb Dispatch · Issue ${String(data.issueNumber).padStart(2, '0')}</title>
    <style>${REDLEB_DISPATCH_CSS}</style>
  </head>
  <body>
    ${root.outerHTML}
  </body>
</html>`);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 400);
    setMessage('In the print window: Destination → Save as PDF, then Save.');
  }

  function updateNews(index: number, patch: Partial<NewsletterNewsBlock>) {
    setData((prev) => {
      const clubNews = [...prev.clubNews];
      clubNews[index] = { ...clubNews[index], ...patch };
      return { ...prev, clubNews };
    });
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="RedLeb Dispatch"
        title="Monthly newsletter"
        description="Fill the Issue 01 template with this month’s text and photos, then click Done to generate the PDF."
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" className="kop-btn-secondary" onClick={() => setPreviewOpen((v) => !v)}>
              {previewOpen ? 'Hide preview' : 'Show preview'}
            </button>
            <button type="button" className="kop-btn-primary" onClick={generatePdf}>
              Done · Generate PDF
            </button>
          </div>
        }
      />

      <div className="rounded-xl border border-pitch/20 bg-pitch/5 px-4 py-3 text-sm text-pitch">
        Design locked to your official PDF (<strong>issue01-reference.pdf</strong>) — cover, graphics and layout
        are rendered from the file you provided. You only change text, photos and issue number. {pageCount} pages
        this issue.
      </div>

      <AdminNewsletterPublish />

      <div className={previewOpen ? 'grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]' : 'grid gap-6'}>
        <div className="space-y-6">
          <div className="kop-card grid gap-4 p-6 md:grid-cols-2">
            <h2 className="text-lg font-bold md:col-span-2">Issue</h2>
            <Field label="Issue number">
              <TextInput
                value={data.issueNumber}
                onChange={(v) => setData((p) => ({ ...p, issueNumber: Number(v) || 1 }))}
              />
            </Field>
            <Field label="Month line">
              <TextInput
                value={data.monthLabel}
                onChange={(v) => setData((p) => ({ ...p, monthLabel: v.toUpperCase() }))}
                placeholder="SEPTEMBER 2026"
              />
            </Field>
            <Field label="Arabic cover line">
              <TextInput
                value={data.arabicLine}
                onChange={(v) => setData((p) => ({ ...p, arabicLine: v }))}
              />
            </Field>
          </div>

          <div className="kop-card grid gap-4 p-6">
            <h2 className="text-lg font-bold">From the Committee</h2>
            <Field label="Title">
              <TextInput
                value={data.chairperson.title}
                onChange={(v) => setData((p) => ({ ...p, chairperson: { ...p.chairperson, title: v } }))}
              />
            </Field>
            <Field label="Greeting">
              <TextInput
                value={data.chairperson.greeting}
                onChange={(v) => setData((p) => ({ ...p, chairperson: { ...p.chairperson, greeting: v } }))}
              />
            </Field>
            <Field label="Letter">
              <TextArea
                rows={12}
                value={data.chairperson.body}
                onChange={(v) => setData((p) => ({ ...p, chairperson: { ...p.chairperson, body: v } }))}
                placeholder="Write this month’s chairperson letter. Use a blank line between paragraphs."
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Sign-off name">
                <TextInput
                  value={data.chairperson.name}
                  onChange={(v) => setData((p) => ({ ...p, chairperson: { ...p.chairperson, name: v } }))}
                />
              </Field>
              <Field label="Role">
                <TextInput
                  value={data.chairperson.role}
                  onChange={(v) => setData((p) => ({ ...p, chairperson: { ...p.chairperson, role: v } }))}
                />
              </Field>
            </div>
          </div>

          <div className="kop-card grid gap-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Season review</h2>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={data.seasonReview.enabled}
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      seasonReview: { ...p.seasonReview, enabled: e.target.checked },
                    }))
                  }
                />
                Include this page
              </label>
            </div>
            <Field label="Title">
              <TextInput
                value={data.seasonReview.title}
                onChange={(v) => setData((p) => ({ ...p, seasonReview: { ...p.seasonReview, title: v } }))}
              />
            </Field>
            <Field label="Body">
              <TextArea
                value={data.seasonReview.body}
                onChange={(v) => setData((p) => ({ ...p, seasonReview: { ...p.seasonReview, body: v } }))}
              />
            </Field>
            <div className="space-y-2">
              <div className="text-sm font-medium">League table</div>
              {data.seasonReview.tableRows.map((row, index) => (
                <div key={index} className="grid grid-cols-[70px_1fr_80px] gap-2">
                  <input
                    className="kop-input"
                    placeholder="Pos"
                    value={row.pos}
                    onChange={(e) => {
                      const tableRows = [...data.seasonReview.tableRows];
                      tableRows[index] = { ...row, pos: e.target.value };
                      setData((p) => ({ ...p, seasonReview: { ...p.seasonReview, tableRows } }));
                    }}
                  />
                  <input
                    className="kop-input"
                    placeholder="Club"
                    value={row.club}
                    onChange={(e) => {
                      const tableRows = [...data.seasonReview.tableRows];
                      tableRows[index] = { ...row, club: e.target.value };
                      setData((p) => ({ ...p, seasonReview: { ...p.seasonReview, tableRows } }));
                    }}
                  />
                  <input
                    className="kop-input"
                    placeholder="Pts"
                    value={row.pts}
                    onChange={(e) => {
                      const tableRows = [...data.seasonReview.tableRows];
                      tableRows[index] = { ...row, pts: e.target.value };
                      setData((p) => ({ ...p, seasonReview: { ...p.seasonReview, tableRows } }));
                    }}
                  />
                </div>
              ))}
            </div>
            <Field label="Together section title">
              <TextInput
                value={data.seasonReview.togetherTitle}
                onChange={(v) =>
                  setData((p) => ({ ...p, seasonReview: { ...p.seasonReview, togetherTitle: v } }))
                }
              />
            </Field>
            <Field label="Together body">
              <TextArea
                value={data.seasonReview.togetherBody}
                onChange={(v) =>
                  setData((p) => ({ ...p, seasonReview: { ...p.seasonReview, togetherBody: v } }))
                }
              />
            </Field>
            <PhotoFields
              photos={data.seasonReview.photos}
              accessToken={accessToken}
              onError={setMessage}
              onChange={(photos) =>
                setData((p) => ({ ...p, seasonReview: { ...p.seasonReview, photos } }))
              }
            />
          </div>

          {data.clubNews.map((block, index) => (
            <div key={block.id} className="kop-card grid gap-4 p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold">Club news {index + 1}</h2>
                {data.clubNews.length > 1 ? (
                  <button
                    type="button"
                    className="kop-btn-secondary !py-2 !text-xs"
                    onClick={() =>
                      setData((p) => ({ ...p, clubNews: p.clubNews.filter((b) => b.id !== block.id) }))
                    }
                  >
                    Remove story
                  </button>
                ) : null}
              </div>
              <Field label="Kicker">
                <TextInput value={block.kicker} onChange={(v) => updateNews(index, { kicker: v })} />
              </Field>
              <Field label="Title">
                <TextInput value={block.title} onChange={(v) => updateNews(index, { title: v })} />
              </Field>
              <Field label="Body">
                <TextArea value={block.body} onChange={(v) => updateNews(index, { body: v })} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Quote (optional)">
                  <TextArea rows={3} value={block.quote} onChange={(v) => updateNews(index, { quote: v })} />
                </Field>
                <Field label="Quote author">
                  <TextInput
                    value={block.quoteAuthor}
                    onChange={(v) => updateNews(index, { quoteAuthor: v })}
                  />
                </Field>
              </div>
              <PhotoFields
                photos={block.photos}
                accessToken={accessToken}
                onError={setMessage}
                onChange={(photos) => updateNews(index, { photos })}
              />
            </div>
          ))}
          <button
            type="button"
            className="kop-btn-secondary"
            onClick={() =>
              setData((p) => ({
                ...p,
                clubNews: [
                  ...p.clubNews,
                  {
                    id: newId(),
                    kicker: 'CLUB NEWS',
                    title: '',
                    body: '',
                    quote: '',
                    quoteAuthor: '',
                    photos: [emptyPhoto()],
                  },
                ],
              }))
            }
          >
            + Add club news page
          </button>

          <div className="kop-card grid gap-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">On the pitch</h2>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={data.onThePitch.enabled}
                  onChange={(e) =>
                    setData((p) => ({ ...p, onThePitch: { ...p.onThePitch, enabled: e.target.checked } }))
                  }
                />
                Include this page
              </label>
            </div>
            <Field label="Title">
              <TextInput
                value={data.onThePitch.title}
                onChange={(v) => setData((p) => ({ ...p, onThePitch: { ...p.onThePitch, title: v } }))}
              />
            </Field>
            <Field label="Body">
              <TextArea
                value={data.onThePitch.body}
                onChange={(v) => setData((p) => ({ ...p, onThePitch: { ...p.onThePitch, body: v } }))}
              />
            </Field>
            <div className="space-y-2">
              <div className="text-sm font-medium">Result cards</div>
              {data.onThePitch.results.map((row, index) => (
                <div key={index} className="grid gap-2 md:grid-cols-2">
                  <input
                    className="kop-input"
                    placeholder="W 4-2"
                    value={row.result}
                    onChange={(e) => {
                      const results = [...data.onThePitch.results];
                      results[index] = { ...row, result: e.target.value };
                      setData((p) => ({ ...p, onThePitch: { ...p.onThePitch, results } }));
                    }}
                  />
                  <input
                    className="kop-input"
                    placeholder="SUNDERLAND, NASHVILLE"
                    value={row.label}
                    onChange={(e) => {
                      const results = [...data.onThePitch.results];
                      results[index] = { ...row, label: e.target.value };
                      setData((p) => ({ ...p, onThePitch: { ...p.onThePitch, results } }));
                    }}
                  />
                </div>
              ))}
              <button
                type="button"
                className="kop-btn-secondary !py-2 !text-xs"
                onClick={() =>
                  setData((p) => ({
                    ...p,
                    onThePitch: {
                      ...p.onThePitch,
                      results: [...p.onThePitch.results, { result: '', label: '' }],
                    },
                  }))
                }
              >
                + Result
              </button>
            </div>
            <Field label="Fixtures intro">
              <TextArea
                rows={3}
                value={data.onThePitch.fixturesBody}
                onChange={(v) => setData((p) => ({ ...p, onThePitch: { ...p.onThePitch, fixturesBody: v } }))}
              />
            </Field>
            {data.onThePitch.fixtures.map((row, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-2">
                <input
                  className="kop-input"
                  placeholder="Aug 23"
                  value={row.date}
                  onChange={(e) => {
                    const fixtures = [...data.onThePitch.fixtures];
                    fixtures[index] = { ...row, date: e.target.value };
                    setData((p) => ({ ...p, onThePitch: { ...p.onThePitch, fixtures } }));
                  }}
                />
                <input
                  className="kop-input"
                  placeholder="NEWCASTLE UNITED (A)"
                  value={row.opponent}
                  onChange={(e) => {
                    const fixtures = [...data.onThePitch.fixtures];
                    fixtures[index] = { ...row, opponent: e.target.value };
                    setData((p) => ({ ...p, onThePitch: { ...p.onThePitch, fixtures } }));
                  }}
                />
              </div>
            ))}
            <Field label="Get involved">
              <TextArea
                rows={3}
                value={data.onThePitch.getInvolved}
                onChange={(v) => setData((p) => ({ ...p, onThePitch: { ...p.onThePitch, getInvolved: v } }))}
              />
            </Field>
            <Field label="Membership note">
              <TextArea
                rows={3}
                value={data.onThePitch.membership}
                onChange={(v) => setData((p) => ({ ...p, onThePitch: { ...p.onThePitch, membership: v } }))}
              />
            </Field>
          </div>

          <div className="kop-card grid gap-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">In memory (optional last page)</h2>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={data.memorial.enabled}
                  onChange={(e) =>
                    setData((p) => ({ ...p, memorial: { ...p.memorial, enabled: e.target.checked } }))
                  }
                />
                Include this page
              </label>
            </div>
            <Field label="Name">
              <TextInput
                value={data.memorial.name}
                onChange={(v) => setData((p) => ({ ...p, memorial: { ...p.memorial, name: v } }))}
              />
            </Field>
            <Field label="Dates">
              <TextInput
                value={data.memorial.dates}
                onChange={(v) => setData((p) => ({ ...p, memorial: { ...p.memorial, dates: v } }))}
                placeholder="26 APRIL 1990 – 20 JUNE 2026"
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" className="kop-btn-primary" onClick={generatePdf}>
              Done · Generate PDF
            </button>
            <button
              type="button"
              className="kop-btn-secondary"
              onClick={() => {
                void (async () => {
                  const ok = await confirm({
                    title: 'New issue',
                    message: 'Start a blank issue? The current draft will be replaced.',
                    confirmLabel: 'Continue',
                  });
                  if (ok) setData(createEmptyNewsletter(data.issueNumber + 1));
                })();
              }}
            >
              New issue
            </button>
          </div>
          {message ? (
            <div className="rounded-xl border border-pitch/20 bg-pitch/5 px-4 py-3 text-sm text-pitch">
              {message}
            </div>
          ) : null}
        </div>

        <div className={previewOpen ? 'xl:sticky xl:top-20 xl:max-h-[calc(100vh-7rem)] xl:overflow-auto' : 'hidden'}>
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-black/40">
            Live preview · {pageCount} pages
          </div>
          <div className="origin-top scale-[0.48] xl:scale-[0.42]" style={{ width: '210mm' }}>
            <style>{REDLEB_DISPATCH_CSS}</style>
            <RedlebDispatch data={data} />
          </div>
        </div>
      </div>

      {!previewOpen ? (
        <div className="hidden">
          <style>{REDLEB_DISPATCH_CSS}</style>
          <RedlebDispatch data={data} />
        </div>
      ) : null}
    </section>
  );
}
