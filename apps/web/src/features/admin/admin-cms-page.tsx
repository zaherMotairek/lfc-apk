import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';

type CmsSection = {
  id?: string;
  type: string;
  title?: string | null;
  subtitle?: string | null;
  content?: Record<string, unknown> | null;
  imageUrl?: string | null;
  sortOrder: number;
  isEnabled: boolean;
};

type CmsPage = {
  code: string;
  title: string;
  isPublished: boolean;
  sections: CmsSection[];
};

const PAGES = [
  { code: 'HOME', label: 'Home', path: '/', hint: 'Hero title, subtitle and main button' },
  { code: 'ABOUT', label: 'About', path: '/about', hint: 'Club story and values' },
  { code: 'COMMITTEE', label: 'Committee', path: '/committee', hint: 'Committee members and roles' },
  { code: 'EVENTS', label: 'Events', path: '/events', hint: 'Public events intro' },
  { code: 'GALLERY', label: 'Gallery', path: '/gallery', hint: 'Gallery intro' },
  { code: 'MEMBERSHIP', label: 'Membership', path: '/membership', hint: 'How to join OLSC Lebanon' },
  { code: 'CONTACT', label: 'Contact', path: '/contact', hint: 'Contact details and form intro' },
] as const;

const SECTION_TYPES = [
  'HERO',
  'RICH_TEXT',
  'IMAGE_BANNER',
  'FEATURED_NEWS',
  'FEATURED_EVENTS',
  'COMMITTEE_LIST',
  'GALLERY_PREVIEW',
  'CTA',
] as const;

function asRecord(value: CmsSection['content']): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {};
}

function textValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export function AdminCmsPage() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [code, setCode] = useState<(typeof PAGES)[number]['code']>('HOME');
  const [draft, setDraft] = useState<CmsPage | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pageQuery = useQuery({
    queryKey: ['admin-cms', code],
    queryFn: () => apiRequest<CmsPage>(`/admin/cms/pages/${code}`, { token: accessToken }),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (pageQuery.data) {
      setDraft(pageQuery.data);
      setMessage(null);
    }
  }, [pageQuery.data]);

  const selectedMeta = useMemo(() => PAGES.find((page) => page.code === code) ?? PAGES[0], [code]);

  function updateDraft(patch: Partial<CmsPage>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function updateSection(index: number, patch: Partial<CmsSection>) {
    setDraft((prev) => {
      if (!prev) return prev;
      const sections = [...prev.sections];
      sections[index] = { ...sections[index], ...patch };
      return { ...prev, sections };
    });
  }

  function updateSectionContent(index: number, key: string, value: string) {
    setDraft((prev) => {
      if (!prev) return prev;
      const sections = [...prev.sections];
      const content = asRecord(sections[index].content);
      content[key] = value;
      sections[index] = { ...sections[index], content };
      return { ...prev, sections };
    });
  }

  function addSection() {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: [
          ...prev.sections,
          {
            type: 'RICH_TEXT',
            title: '',
            subtitle: '',
            content: { body: '' },
            imageUrl: '',
            sortOrder: prev.sections.length + 1,
            isEnabled: true,
          },
        ],
      };
    });
  }

  function removeSection(index: number) {
    if (!window.confirm('Delete this section?')) return;
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.filter((_, i) => i !== index).map((section, i) => ({
          ...section,
          sortOrder: i + 1,
        })),
      };
    });
  }

  function moveSection(index: number, direction: -1 | 1) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = index + direction;
      if (next < 0 || next >= prev.sections.length) return prev;
      const sections = [...prev.sections];
      const [item] = sections.splice(index, 1);
      sections.splice(next, 0, item);
      return {
        ...prev,
        sections: sections.map((section, i) => ({ ...section, sortOrder: i + 1 })),
      };
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await apiRequest<{ message: string; page: CmsPage }>(`/admin/cms/pages/${code}`, {
        method: 'PUT',
        token: accessToken,
        body: {
          title: draft.title,
          isPublished: draft.isPublished,
          sections: draft.sections.map((section, index) => ({
            type: section.type,
            title: section.title,
            subtitle: section.subtitle,
            content: section.content ?? {},
            imageUrl: section.imageUrl,
            sortOrder: index + 1,
            isEnabled: section.isEnabled,
          })),
        },
      });
      setDraft(result.page);
      setMessage(result.message);
      await queryClient.invalidateQueries({ queryKey: ['admin-cms', code] });
      await queryClient.invalidateQueries({ queryKey: ['cms-page', code] });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save page');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Website"
        title="CMS pages"
        description="Edit public website pages. Change titles, texts, and sections without touching the code."
      />

      {message ? (
        <div className="rounded-xl border border-pitch/20 bg-pitch/5 px-4 py-3 text-sm text-pitch">
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <aside className="space-y-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-black/40">Pages</h2>
            <p className="mt-1 text-xs text-black/45">Select a page, then edit it on the right.</p>
          </div>
          {PAGES.map((page) => {
            const active = page.code === code;
            return (
              <button
                key={page.code}
                type="button"
                onClick={() => setCode(page.code)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  active
                    ? 'border-lfc-red/30 bg-lfc-red/[0.06] shadow-sm'
                    : 'border-black/10 bg-surface hover:border-black/15'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink">{page.label}</span>
                  <span className="text-[11px] text-black/35">{page.path}</span>
                </div>
                <p className="mt-1 text-xs text-black/50">{page.hint}</p>
              </button>
            );
          })}
        </aside>

        <div className="min-w-0">
          {pageQuery.isLoading && !draft ? (
            <div className="kop-card animate-pulse p-8">
              <div className="h-5 w-1/3 rounded bg-black/5" />
              <div className="mt-4 h-24 rounded bg-black/5" />
            </div>
          ) : null}

          {pageQuery.isError ? (
            <div className="kop-card p-6 text-sm text-lfc-red">
              {pageQuery.error instanceof Error ? pageQuery.error.message : 'Failed to load this page.'}
            </div>
          ) : null}

          {draft ? (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="kop-card space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={draft.isPublished ? 'kop-badge-green' : 'kop-badge'}>
                        {draft.isPublished ? 'Published' : 'Hidden'}
                      </span>
                      <span className="kop-badge">{selectedMeta.label}</span>
                    </div>
                    <h2 className="mt-2 text-xl font-extrabold text-ink">{selectedMeta.label}</h2>
                    <p className="mt-1 text-sm text-black/50">{selectedMeta.hint}</p>
                  </div>
                  <Link to={selectedMeta.path} className="kop-btn-secondary !px-4 !py-2 !text-xs" target="_blank" rel="noreferrer">
                    Open public page
                  </Link>
                </div>

                <label className="block text-sm font-medium">
                  Page title
                  <input
                    className="kop-input"
                    value={draft.title}
                    onChange={(e) => updateDraft({ title: e.target.value })}
                    required
                  />
                </label>

                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={draft.isPublished}
                    onChange={(e) => updateDraft({ isPublished: e.target.checked })}
                  />
                  Visible on the public website
                </label>
              </div>

              {(draft.sections ?? []).map((section, index) => {
                const content = asRecord(section.content);
                return (
                  <div key={`${section.type}-${index}`} className="kop-card space-y-4 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="kop-badge">{section.type}</span>
                        <span className="text-xs text-black/40">Section {index + 1}</span>
                        {!section.isEnabled ? <span className="kop-badge-red">Hidden</span> : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="kop-btn-secondary !px-3 !py-1.5 !text-xs"
                          onClick={() => moveSection(index, -1)}
                          disabled={index === 0}
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          className="kop-btn-secondary !px-3 !py-1.5 !text-xs"
                          onClick={() => moveSection(index, 1)}
                          disabled={index === draft.sections.length - 1}
                        >
                          Down
                        </button>
                        <button
                          type="button"
                          className="kop-btn-secondary !border-lfc-red/25 !px-3 !py-1.5 !text-xs !text-lfc-red hover:!bg-lfc-red/5"
                          onClick={() => removeSection(index)}
                        >
                          Delete section
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-medium">
                        Type
                        <select
                          className="kop-input"
                          value={section.type}
                          onChange={(e) => updateSection(index, { type: e.target.value })}
                        >
                          {SECTION_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex items-center gap-2 self-end text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={section.isEnabled}
                          onChange={(e) => updateSection(index, { isEnabled: e.target.checked })}
                        />
                        Show this section
                      </label>
                    </div>

                    <label className="block text-sm font-medium">
                      Title
                      <input
                        className="kop-input"
                        value={section.title ?? ''}
                        onChange={(e) => updateSection(index, { title: e.target.value })}
                      />
                    </label>
                    <label className="block text-sm font-medium">
                      Subtitle
                      <textarea
                        className="kop-input min-h-20"
                        value={section.subtitle ?? ''}
                        onChange={(e) => updateSection(index, { subtitle: e.target.value })}
                      />
                    </label>
                    <label className="block text-sm font-medium">
                      Body
                      <textarea
                        className="kop-input min-h-28"
                        value={textValue(content.body)}
                        onChange={(e) => updateSectionContent(index, 'body', e.target.value)}
                        placeholder="Main text for this section"
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-medium">
                        Button label
                        <input
                          className="kop-input"
                          value={textValue(content.primaryButtonLabel)}
                          onChange={(e) => updateSectionContent(index, 'primaryButtonLabel', e.target.value)}
                          placeholder="Join now, Contact us…"
                        />
                      </label>
                      <label className="block text-sm font-medium">
                        Image URL
                        <input
                          className="kop-input"
                          value={section.imageUrl ?? ''}
                          onChange={(e) => updateSection(index, { imageUrl: e.target.value })}
                          placeholder="https://…"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-wrap gap-2">
                <button type="button" className="kop-btn-secondary" onClick={addSection}>
                  + Add section
                </button>
                <button type="submit" className="kop-btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save page'}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </section>
  );
}
