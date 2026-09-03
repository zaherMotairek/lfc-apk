import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { EditableText } from '../cms/editable-text';
import { InlineEditToolbar } from '../cms/inline-edit-toolbar';
import type { PillarItem } from '../cms/cms-types';
import { CmsInlineEditProvider, useCmsInlineEdit } from '../cms/use-cms-inline-edit';

function getCtaContent<T extends Record<string, unknown>>(
  getSection: ReturnType<typeof useCmsInlineEdit>['getSection'],
  block: string,
  fallback: T,
): T {
  const section = getSection('CTA', block);
  return { ...fallback, ...((section?.content as T | undefined) ?? {}) };
}

function MembershipPublicPageContent() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { page, isLoading, getSection, updateSection, updateContent } = useCmsInlineEdit();

  if (isLoading || !page) {
    return (
      <div className="kop-container py-20 text-center text-black/50">Loading…</div>
    );
  }

  const hero = getSection('HERO');
  const richText = getSection('RICH_TEXT');
  const richContent = (richText?.content ?? {}) as { body?: string };
  const heroContent = (hero?.content ?? {}) as { primaryButtonLabel?: string };

  const twoPaths = getCtaContent(getSection, 'twoPaths', {
    eyebrow: 'Two paths',
    heading: 'New members & existing card holders',
    intro:
      'Whether you are joining for the first time or you already have a printed OLSC card, the Kop Platform supports both journeys.',
    newTitle: 'New to the platform',
    newBody: 'Request membership information or activate your account after committee approval.',
    existingTitle: 'Already have a card',
    existingBody:
      'Many members already received a physical OLSC card. Log in and upload a photo — we link it to your digital profile.',
  });

  const steps = getCtaContent(getSection, 'steps', {
    eyebrow: 'How it works',
    heading: 'From committee to Kop Platform',
    items: [] as PillarItem[],
  });

  const footer = getCtaContent(getSection, 'footer', {
    title: 'Ready for your digital card?',
    body: 'Log in, open your membership card, and upload a scan of your existing OLSC card in one minute.',
  });

  function updateStep(index: number, patch: Partial<PillarItem>) {
    const items = [...(steps.items as PillarItem[])];
    items[index] = { ...items[index], ...patch };
    updateContent('CTA', { items }, 'steps');
  }

  return (
    <div className="pb-24 md:pb-28">
      <InlineEditToolbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-black/5">
        <div className="absolute inset-0 kop-gradient-hero opacity-[0.06]" />
        <div className="kop-container relative py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="kop-badge-red mb-4">Official OLSC Lebanon</p>
            <EditableText
              as="h1"
              className="text-4xl font-extrabold tracking-tight text-ink md:text-5xl"
              value={hero?.title ?? 'Membership'}
              onSave={(value) => updateSection('HERO', { title: value })}
            />
            <EditableText
              as="p"
              multiline
              className="mt-5 block max-w-2xl text-lg leading-relaxed text-black/60"
              value={
                hero?.subtitle ??
                'Join the official Liverpool supporters community in Lebanon — with a professional digital card for members who already hold official OLSC membership.'
              }
              onSave={(value) => updateSection('HERO', { subtitle: value })}
            />

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact" className="kop-btn-primary">
                <EditableText
                  value={heroContent.primaryButtonLabel ?? 'Contact Committee'}
                  onSave={(value) =>
                    updateSection('HERO', { content: { primaryButtonLabel: value } })
                  }
                />
              </Link>
              {isAuthenticated ? (
                <Link to="/app/membership-card" className="kop-btn-secondary">
                  Open my digital card
                </Link>
              ) : (
                <Link
                  to="/login"
                  state={{ from: { pathname: location.pathname, search: location.search } }}
                  className="kop-btn-secondary"
                >
                  Member login
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Two paths */}
      <section className="kop-container py-16">
        <div className="mb-8 max-w-2xl">
          <EditableText
            as="p"
            className="kop-badge-green mb-3 inline-block"
            value={twoPaths.eyebrow}
            onSave={(value) => updateContent('CTA', { eyebrow: value }, 'twoPaths')}
          />
          <EditableText
            as="h2"
            className="kop-section-title"
            value={twoPaths.heading}
            onSave={(value) => updateContent('CTA', { heading: value }, 'twoPaths')}
          />
          <EditableText
            as="p"
            multiline
            className="mt-3 block text-black/55"
            value={twoPaths.intro}
            onSave={(value) => updateContent('CTA', { intro: value }, 'twoPaths')}
          />
        </div>

        <ol className="grid gap-4 md:grid-cols-3">
          <li className="kop-card p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-lfc-red">Step 1</div>
            <h3 className="mt-2 font-bold">Apply for 2026/27 membership</h3>
            <p className="mt-2 text-sm leading-relaxed text-black/55">
              Complete the online form and transfer the fee via Whish Money or OMT Pay.
            </p>
            <Link to="/membership/apply" className="kop-btn-primary mt-4 w-full !py-2 !text-sm">
              Apply now
            </Link>
          </li>
          <li className="kop-card p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-lfc-red">Step 2</div>
            <h3 className="mt-2 font-bold">Create your account</h3>
            <p className="mt-2 text-sm leading-relaxed text-black/55">
              Sign up with a username and password, then add your name and OLSC / LFC IDs in your profile.
            </p>
            <Link to="/signup" className="kop-btn-secondary mt-4 w-full !py-2 !text-sm">
              Sign up
            </Link>
          </li>
          <li className="kop-card p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-lfc-red">Step 3</div>
            <h3 className="mt-2 font-bold">Open your digital card</h3>
            <p className="mt-2 text-sm leading-relaxed text-black/55">
              Show the QR at events. If you already have a printed card, upload a photo there.
            </p>
            {isAuthenticated ? (
              <Link to="/app/membership-card" className="kop-btn-primary mt-4 w-full !py-2 !text-sm">
                Open my card
              </Link>
            ) : (
              <Link
                to="/login"
                state={{ from: { pathname: location.pathname, search: location.search } }}
                className="kop-btn-primary mt-4 w-full !py-2 !text-sm"
              >
                Member login
              </Link>
            )}
          </li>
        </ol>
      </section>

      {/* How it works */}
      <section className="border-y border-black/5 bg-paper/80 py-16 backdrop-blur-sm">
        <div className="kop-container">
          <div className="mb-10 text-center">
            <EditableText
              as="p"
              className="kop-badge-red mb-3 block"
              value={steps.eyebrow}
              onSave={(value) => updateContent('CTA', { eyebrow: value }, 'steps')}
            />
            <EditableText
              as="h2"
              className="kop-section-title"
              value={steps.heading}
              onSave={(value) => updateContent('CTA', { heading: value }, 'steps')}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(steps.items as PillarItem[]).map((step, index) => (
              <div key={`${step.title}-${index}`} className="kop-card p-5">
                <EditableText
                  as="div"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-lfc-red/10 text-lg"
                  value={step.icon}
                  onSave={(value) => updateStep(index, { icon: value })}
                />
                <div className="mt-4 text-xs font-bold uppercase tracking-wider text-lfc-red">
                  Step {index + 1}
                </div>
                <EditableText
                  as="h3"
                  className="mt-2 font-bold"
                  value={step.title}
                  onSave={(value) => updateStep(index, { title: value })}
                />
                <EditableText
                  as="p"
                  multiline
                  className="mt-2 block text-sm leading-relaxed text-black/55"
                  value={step.description}
                  onSave={(value) => updateStep(index, { description: value })}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CMS body */}
      {richContent.body ? (
        <section className="kop-container py-16">
          <div className="kop-card mx-auto max-w-3xl p-8">
            <h2 className="text-2xl font-bold">Committee notes</h2>
            <EditableText
              as="div"
              multiline
              className="mt-4 block whitespace-pre-wrap leading-relaxed text-black/70"
              value={richContent.body}
              onSave={(value) => updateContent('RICH_TEXT', { body: value })}
            />
          </div>
        </section>
      ) : null}

      {/* CTA */}
      <section className="kop-container pb-20 pt-4">
        <div className="kop-gradient-dark rounded-3xl px-8 py-12 text-center text-white md:px-16">
          <EditableText
            as="h2"
            className="text-3xl font-extrabold"
            value={footer.title}
            onSave={(value) => updateContent('CTA', { title: value }, 'footer')}
          />
          <EditableText
            as="p"
            multiline
            className="mx-auto mt-3 block max-w-xl text-white/65"
            value={footer.body}
            onSave={(value) => updateContent('CTA', { body: value }, 'footer')}
          />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/membership/apply"
              className="kop-btn-primary !bg-white !text-ink hover:!bg-white/90"
            >
              Apply for membership
            </Link>
            <Link
              to={isAuthenticated ? '/app/membership-card' : '/login'}
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {isAuthenticated ? 'Go to my card' : 'Member login'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function MembershipPublicPage() {
  return (
    <CmsInlineEditProvider pageCode="MEMBERSHIP">
      <MembershipPublicPageContent />
    </CmsInlineEditProvider>
  );
}
