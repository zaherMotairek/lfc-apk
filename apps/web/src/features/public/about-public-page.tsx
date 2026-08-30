import { Link } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import {
  DEFAULT_ABOUT_HIGHLIGHTS,
  DEFAULT_ABOUT_PILLARS,
  DEFAULT_ABOUT_PLATFORM_FEATURES,
  DEFAULT_ABOUT_STORY,
} from '../cms/about-cms-defaults';
import { EditableText } from '../cms/editable-text';
import { InlineEditToolbar } from '../cms/inline-edit-toolbar';
import type { HighlightItem, PillarItem } from '../cms/cms-types';
import { CmsInlineEditProvider, useCmsInlineEdit } from '../cms/use-cms-inline-edit';

function getCtaContent<T extends Record<string, unknown>>(
  getSection: ReturnType<typeof useCmsInlineEdit>['getSection'],
  block: string,
  fallback: T,
): T {
  const section = getSection('CTA', block);
  return { ...fallback, ...((section?.content as T | undefined) ?? {}) };
}

function AboutPublicPageContent() {
  const { isAuthenticated } = useAuth();
  const { page, isLoading, getSection, updateSection, updateContent } = useCmsInlineEdit();

  if (isLoading || !page) {
    return (
      <div className="kop-container py-20 text-center text-black/50">Loading…</div>
    );
  }

  const hero = getSection('HERO');
  const richText = getSection('RICH_TEXT');
  const richContent = (richText?.content ?? {}) as {
    body?: string;
    storyEyebrow?: string;
    storyHeading?: string;
  };

  const highlights = getCtaContent(getSection, 'highlights', {
    items: DEFAULT_ABOUT_HIGHLIGHTS,
  });
  const quote = getCtaContent(getSection, 'quote', {
    icon: '🎵',
    quote: 'When you walk through a storm, hold your head up high…',
    quoteBody:
      "You'll Never Walk Alone echoes in every OLSC Lebanon watch party — a promise we keep to each other, season after season.",
    quoteFooter: "You'll Never Walk Alone",
  });
  const pillars = getCtaContent(getSection, 'pillars', {
    eyebrow: 'What we stand for',
    heading: 'The Kop values — Lebanese edition',
    items: DEFAULT_ABOUT_PILLARS,
  });
  const platform = getCtaContent(getSection, 'platform', {
    eyebrow: 'Kop Platform',
    title: 'Your digital Kop identity',
    body: 'Official members get access to Match Hub predictions, live goal notifications, digital membership cards, community events, and the Hall of Fame — the full supporters club experience, built for OLSC Lebanon.',
    features: DEFAULT_ABOUT_PLATFORM_FEATURES,
  });
  const footer = getCtaContent(getSection, 'footer', {
    title: 'Ready to walk with us?',
    body: "Whether you've supported Liverpool for decades or you're just starting your journey — OLSC Lebanon is your home. Official membership is managed by our committee.",
  });

  function updatePillar(index: number, patch: Partial<PillarItem>) {
    const items = [...(pillars.items as PillarItem[])];
    items[index] = { ...items[index], ...patch };
    updateContent('CTA', { items }, 'pillars');
  }

  function updateHighlight(index: number, patch: Partial<HighlightItem>) {
    const items = [...(highlights.items as HighlightItem[])];
    items[index] = { ...items[index], ...patch };
    updateContent('CTA', { items }, 'highlights');
  }

  function updatePlatformFeature(index: number, value: string) {
    const features = [...(platform.features as string[])];
    features[index] = value;
    updateContent('CTA', { features }, 'platform');
  }

  const heroContent = (hero?.content ?? {}) as { primaryButtonLabel?: string };

  return (
    <div className="pb-24 md:pb-28">
      <InlineEditToolbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-black/5">
        <div className="absolute inset-0 kop-gradient-hero opacity-[0.08]" />
        <div className="kop-container relative py-16 md:py-24">
          <div className="max-w-4xl">
            <p className="kop-badge-red mb-4">Official Liverpool Supporters Club · Lebanon</p>
            <EditableText
              as="h1"
              className="text-4xl font-extrabold leading-[1.05] tracking-tight text-ink md:text-6xl"
              value={hero?.title ?? 'We Are OLSC Lebanon'}
              onSave={(value) => updateSection('HERO', { title: value })}
            />
            <EditableText
              as="p"
              multiline
              className="mt-6 block max-w-2xl text-xl leading-relaxed text-black/60 md:text-2xl"
              value={
                hero?.subtitle ??
                'The official home of Liverpool FC supporters in Lebanon — where the Kop spirit lives, from Beirut to every corner of the country.'
              }
              onSave={(value) => updateSection('HERO', { subtitle: value })}
            />
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/membership" className="kop-btn-primary">
                <EditableText
                  value={heroContent.primaryButtonLabel ?? 'Join the Kop'}
                  onSave={(value) =>
                    updateSection('HERO', { content: { primaryButtonLabel: value } })
                  }
                />
              </Link>
              <Link to="/events" className="kop-btn-secondary">
                Upcoming events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-black/5 bg-white/70 py-10 backdrop-blur-sm">
        <div className="kop-container grid grid-cols-2 gap-6 md:grid-cols-4">
          {(highlights.items as HighlightItem[]).map((item, index) => (
            <div key={`${item.label}-${index}`} className="text-center">
              <EditableText
                as="div"
                className="text-2xl font-extrabold text-lfc-red md:text-3xl"
                value={item.value}
                onSave={(value) => updateHighlight(index, { value })}
              />
              <EditableText
                as="div"
                className="mt-1 block text-xs font-semibold uppercase tracking-wider text-black/45"
                value={item.label}
                onSave={(value) => updateHighlight(index, { label: value })}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="kop-container py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <div>
            <EditableText
              as="p"
              className="kop-badge-green mb-4 block"
              value={richContent.storyEyebrow ?? 'Our story'}
              onSave={(value) => updateContent('RICH_TEXT', { storyEyebrow: value })}
            />
            <EditableText
              as="h2"
              className="kop-section-title"
              value={richContent.storyHeading ?? 'More than a club. A family in Lebanon.'}
              onSave={(value) => updateContent('RICH_TEXT', { storyHeading: value })}
            />
            <EditableText
              as="div"
              multiline
              className="mt-8 block whitespace-pre-wrap text-lg leading-relaxed text-black/70"
              value={richContent.body ?? DEFAULT_ABOUT_STORY}
              onSave={(value) => updateContent('RICH_TEXT', { body: value })}
            />
          </div>

          <div className="kop-gradient-hero rounded-3xl p-8 text-white shadow-xl shadow-lfc-red/20">
            <EditableText
              as="div"
              className="text-4xl"
              value={quote.icon}
              onSave={(value) => updateContent('CTA', { icon: value }, 'quote')}
            />
            <blockquote className="mt-4 text-xl font-bold leading-snug">
              &ldquo;
              <EditableText
                value={quote.quote}
                onSave={(value) => updateContent('CTA', { quote: value }, 'quote')}
              />
              &rdquo;
            </blockquote>
            <EditableText
              as="p"
              multiline
              className="mt-4 block text-sm leading-relaxed text-white/75"
              value={quote.quoteBody}
              onSave={(value) => updateContent('CTA', { quoteBody: value }, 'quote')}
            />
            <EditableText
              as="div"
              className="mt-6 block border-t border-white/15 pt-6 text-xs font-bold uppercase tracking-[0.25em] text-white/50"
              value={quote.quoteFooter}
              onSave={(value) => updateContent('CTA', { quoteFooter: value }, 'quote')}
            />
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="border-y border-black/5 bg-white/60 py-16 backdrop-blur-sm">
        <div className="kop-container">
          <div className="mb-10 text-center">
            <EditableText
              as="p"
              className="kop-badge-red mb-3 block"
              value={pillars.eyebrow}
              onSave={(value) => updateContent('CTA', { eyebrow: value }, 'pillars')}
            />
            <EditableText
              as="h2"
              className="kop-section-title"
              value={pillars.heading}
              onSave={(value) => updateContent('CTA', { heading: value }, 'pillars')}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(pillars.items as PillarItem[]).map((pillar, index) => (
              <div key={`${pillar.title}-${index}`} className="kop-card kop-card-hover p-6">
                <EditableText
                  as="div"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lfc-red/10 text-2xl"
                  value={pillar.icon}
                  onSave={(value) => updatePillar(index, { icon: value })}
                />
                <EditableText
                  as="h3"
                  className="mt-4 font-bold text-ink"
                  value={pillar.title}
                  onSave={(value) => updatePillar(index, { title: value })}
                />
                <EditableText
                  as="p"
                  multiline
                  className="mt-2 block text-sm leading-relaxed text-black/55"
                  value={pillar.description}
                  onSave={(value) => updatePillar(index, { description: value })}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform */}
      <section className="kop-container py-16 md:py-20">
        <div className="kop-card overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-10">
              <EditableText
                as="p"
                className="kop-badge-red mb-3 block"
                value={platform.eyebrow}
                onSave={(value) => updateContent('CTA', { eyebrow: value }, 'platform')}
              />
              <EditableText
                as="h2"
                className="text-3xl font-extrabold text-ink"
                value={platform.title}
                onSave={(value) => updateContent('CTA', { title: value }, 'platform')}
              />
              <EditableText
                as="p"
                multiline
                className="mt-4 block leading-relaxed text-black/60"
                value={platform.body}
                onSave={(value) => updateContent('CTA', { body: value }, 'platform')}
              />
              <Link
                to={isAuthenticated ? '/app' : '/login'}
                className="kop-btn-primary mt-6 inline-flex"
              >
                {isAuthenticated ? 'Open member app' : 'Member login'}
              </Link>
            </div>
            <div className="kop-gradient-hero flex flex-col justify-center p-8 text-white md:p-10">
              <div className="space-y-4 text-sm">
                {(platform.features as string[]).map((line, index) => (
                  <div
                    key={`${line}-${index}`}
                    className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3"
                  >
                    <EditableText
                      value={line}
                      onSave={(value) => updatePlatformFeature(index, value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="kop-container pb-20">
        <div className="kop-gradient-dark rounded-3xl px-8 py-12 text-center text-white md:px-16">
          <EditableText
            as="h2"
            className="text-3xl font-extrabold md:text-4xl"
            value={footer.title}
            onSave={(value) => updateContent('CTA', { title: value }, 'footer')}
          />
          <EditableText
            as="p"
            multiline
            className="mx-auto mt-4 block max-w-xl text-white/65"
            value={footer.body}
            onSave={(value) => updateContent('CTA', { body: value }, 'footer')}
          />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/contact" className="kop-btn-primary !bg-white !text-ink hover:!bg-white/90">
              Contact the committee
            </Link>
            <Link
              to="/committee"
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Meet the committee
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function AboutPublicPage() {
  return (
    <CmsInlineEditProvider pageCode="ABOUT">
      <AboutPublicPageContent />
    </CmsInlineEditProvider>
  );
}
