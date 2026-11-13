import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPublicSiteSettings, SITE_SETTING_KEYS } from '../../lib/site-settings';
import {
  DEFAULT_CONTACT_CHANNELS,
  DEFAULT_CONTACT_INTRO,
} from '../cms/contact-cms-defaults';
import { EditableText } from '../cms/editable-text';
import { InlineEditToolbar } from '../cms/inline-edit-toolbar';
import type { ContactChannel } from '../cms/cms-types';
import { CmsInlineEditProvider, useCmsInlineEdit } from '../cms/use-cms-inline-edit';

function getCtaContent<T extends Record<string, unknown>>(
  getSection: ReturnType<typeof useCmsInlineEdit>['getSection'],
  block: string,
  fallback: T,
): T {
  const section = getSection('CTA', block);
  return { ...fallback, ...((section?.content as T | undefined) ?? {}) };
}

function ContactPublicPageContent() {
  const { page, isLoading, getSection, updateSection, updateContent } = useCmsInlineEdit();

  if (isLoading || !page) {
    return <div className="kop-container py-20 text-center text-black/50">Loading…</div>;
  }

  const hero = getSection('HERO');
  const richText = getSection('RICH_TEXT');
  const richContent = (richText?.content ?? {}) as { body?: string };
  const channels = getCtaContent(getSection, 'channels', {
    items: DEFAULT_CONTACT_CHANNELS,
  });
  const siteSettingsQuery = useQuery({
    queryKey: ['site-settings-public'],
    queryFn: fetchPublicSiteSettings,
    staleTime: 60_000,
  });

  const channelItems = useMemo(() => {
    const items = [...(channels.items as ContactChannel[])];
    const whatsapp = siteSettingsQuery.data?.[SITE_SETTING_KEYS.contactWhatsappDisplay];
    if (!whatsapp) return items;
    const digits = whatsapp.replace(/\D/g, '');
    return items.map((channel) =>
      channel.label === 'WhatsApp'
        ? {
            ...channel,
            value: whatsapp,
            href: digits ? `https://wa.me/${digits}` : channel.href,
          }
        : channel,
    );
  }, [channels.items, siteSettingsQuery.data]);

  const intro = richContent.body ?? DEFAULT_CONTACT_INTRO;

  function updateChannel(index: number, patch: Partial<ContactChannel>) {
    const items = [...(channels.items as ContactChannel[])];
    items[index] = { ...items[index], ...patch };
    updateContent('CTA', { items }, 'channels');
  }

  return (
    <div className="pb-24 md:pb-28">
      <InlineEditToolbar />

      <section className="relative overflow-hidden border-b border-black/5">
        <div className="absolute inset-0 kop-gradient-hero opacity-[0.06]" />
        <div className="kop-container relative py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="kop-badge-green mb-4">Get in touch</p>
            <EditableText
              as="h1"
              className="text-4xl font-extrabold tracking-tight text-ink md:text-5xl"
              value={hero?.title ?? 'Contact'}
              onSave={(value) => updateSection('HERO', { title: value })}
            />
            <EditableText
              as="p"
              multiline
              className="mt-5 block max-w-2xl text-lg leading-relaxed text-black/60"
              value={hero?.subtitle ?? 'Get in touch with OLSC Lebanon.'}
              onSave={(value) => updateSection('HERO', { subtitle: value })}
            />
          </div>
        </div>
      </section>

      <section className="kop-container py-16">
        <EditableText
          as="div"
          multiline
          className="kop-card mx-auto mb-12 block max-w-3xl p-8 text-lg leading-relaxed text-black/70"
          value={intro}
          onSave={(value) => updateContent('RICH_TEXT', { body: value })}
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {channelItems.map((channel, index) => (
            <div key={`${channel.label}-${index}`} className="kop-card kop-card-hover p-6 text-center">
              <div className="text-3xl">{channel.icon}</div>
              <EditableText
                as="p"
                className="mt-3 text-xs font-bold uppercase tracking-wider text-black/40"
                value={channel.label}
                onSave={(value) => updateChannel(index, { label: value })}
              />
              {channel.href ? (
                <a
                  href={channel.href}
                  target={channel.href.startsWith('http') ? '_blank' : undefined}
                  rel={channel.href.startsWith('http') ? 'noreferrer' : undefined}
                  className="mt-2 block font-semibold text-lfc-red hover:underline"
                >
                  <EditableText
                    value={channel.value}
                    onSave={(value) => updateChannel(index, { value })}
                  />
                </a>
              ) : (
                <EditableText
                  as="p"
                  className="mt-2 font-semibold text-ink"
                  value={channel.value}
                  onSave={(value) => updateChannel(index, { value })}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="kop-container pb-20">
        <div className="kop-card overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-10">
              <p className="kop-badge-red mb-3">Membership</p>
              <h2 className="text-2xl font-extrabold text-ink">Official OLSC membership</h2>
              <p className="mt-4 leading-relaxed text-black/60">
                For membership requests, card questions, or event partnerships — the committee
                handles all official OLSC Lebanon enquiries.
              </p>
              <Link to="/membership" className="kop-btn-primary mt-6 inline-flex">
                Membership page
              </Link>
            </div>
            <div className="kop-gradient-hero flex flex-col justify-center p-8 text-white md:p-10">
              <div className="text-4xl">🔴</div>
              <p className="mt-4 text-lg font-bold">You&apos;ll Never Walk Alone</p>
              <p className="mt-2 text-sm text-white/75">
                From Beirut to Tripoli — one Kop, one family, one club.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function ContactPublicPage() {
  return (
    <CmsInlineEditProvider pageCode="CONTACT">
      <ContactPublicPageContent />
    </CmsInlineEditProvider>
  );
}
