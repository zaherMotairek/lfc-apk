import { Link } from 'react-router-dom';
import {
  DEFAULT_COMMITTEE_INTRO,
  DEFAULT_COMMITTEE_MEMBERS,
} from '../cms/committee-cms-defaults';
import { EditableText } from '../cms/editable-text';
import { InlineEditToolbar } from '../cms/inline-edit-toolbar';
import type { CommitteeMember } from '../cms/cms-types';
import { CmsInlineEditProvider, useCmsInlineEdit } from '../cms/use-cms-inline-edit';

function CommitteePublicPageContent() {
  const { canEdit, page, isLoading, getSection, updateSection, updateContent } =
    useCmsInlineEdit();

  if (isLoading || !page) {
    return <div className="kop-container py-20 text-center text-black/50">Loading…</div>;
  }

  const hero = getSection('HERO');
  const committeeList = getSection('COMMITTEE_LIST');
  const listContent = (committeeList?.content ?? {}) as {
    intro?: string;
    members?: CommitteeMember[];
  };

  const intro = listContent.intro ?? DEFAULT_COMMITTEE_INTRO;
  const members = listContent.members ?? DEFAULT_COMMITTEE_MEMBERS;

  function updateMember(index: number, patch: Partial<CommitteeMember>) {
    const items = [...members];
    items[index] = { ...items[index], ...patch };
    updateContent('COMMITTEE_LIST', { members: items });
  }

  function addMember() {
    const nextMember: CommitteeMember = {
      name: 'New Member',
      role: 'Committee Role',
      bio: 'Add a short bio for this committee member.',
      initials: 'NM',
      email: 'member@olsclebanon.com',
    };
    updateContent('COMMITTEE_LIST', { members: [...members, nextMember] });
  }

  function removeMember(index: number) {
    const items = members.filter((_, itemIndex) => itemIndex !== index);
    updateContent('COMMITTEE_LIST', { members: items });
  }

  return (
    <div className="pb-24 md:pb-28">
      <InlineEditToolbar />

      <section className="relative overflow-hidden border-b border-black/5">
        <div className="absolute inset-0 kop-gradient-hero opacity-[0.06]" />
        <div className="kop-container relative py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="kop-badge-red mb-4">OLSC Lebanon · Leadership</p>
            <EditableText
              as="h1"
              className="text-4xl font-extrabold tracking-tight text-ink md:text-5xl"
              value={hero?.title ?? 'Committee'}
              onSave={(value) => updateSection('HERO', { title: value })}
            />
            <EditableText
              as="p"
              multiline
              className="mt-5 block max-w-2xl text-lg leading-relaxed text-black/60"
              value={hero?.subtitle ?? 'Meet the people who lead OLSC Lebanon.'}
              onSave={(value) => updateSection('HERO', { subtitle: value })}
            />
          </div>
        </div>
      </section>

      <section className="kop-container py-16">
        <EditableText
          as="p"
          multiline
          className="mx-auto mb-12 block max-w-3xl text-center text-lg leading-relaxed text-black/65"
          value={intro}
          onSave={(value) => updateContent('COMMITTEE_LIST', { intro: value })}
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member, index) => (
            <article key={`${member.name}-${index}`} className="kop-card kop-card-hover p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-lfc-red text-lg font-black text-white shadow-lg shadow-lfc-red/25">
                  <EditableText
                    value={member.initials ?? member.name.slice(0, 2).toUpperCase()}
                    onSave={(value) => updateMember(index, { initials: value })}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <EditableText
                    as="h3"
                    className="font-bold text-ink"
                    value={member.name}
                    onSave={(value) => updateMember(index, { name: value })}
                  />
                  <EditableText
                    as="p"
                    className="mt-0.5 text-sm font-semibold text-lfc-red"
                    value={member.role}
                    onSave={(value) => updateMember(index, { role: value })}
                  />
                </div>
              </div>
              <EditableText
                as="p"
                multiline
                className="mt-4 block text-sm leading-relaxed text-black/55"
                value={member.bio}
                onSave={(value) => updateMember(index, { bio: value })}
              />
              <EditableText
                as="p"
                className="mt-4 block text-sm font-semibold text-lfc-red"
                value={member.email ?? ''}
                onSave={(value) => updateMember(index, { email: value })}
              />
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  className="mt-3 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Remove member
                </button>
              ) : null}
            </article>
          ))}
        </div>
        {canEdit ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={addMember}
              className="rounded-xl bg-[#101418] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Add member
            </button>
          </div>
        ) : null}
      </section>

      <section className="kop-container pb-20">
        <div className="kop-gradient-dark rounded-3xl px-8 py-12 text-center text-white md:px-16">
          <h2 className="text-2xl font-extrabold md:text-3xl">Want to get involved?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/65">
            OLSC Lebanon is run by supporters, for supporters. Reach out if you&apos;d like to
            volunteer or propose a community initiative.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/contact" className="kop-btn-primary !bg-white !text-ink hover:!bg-white/90">
              Contact the committee
            </Link>
            <Link to="/membership" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Membership info
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function CommitteePublicPage() {
  return (
    <CmsInlineEditProvider pageCode="COMMITTEE">
      <CommitteePublicPageContent />
    </CmsInlineEditProvider>
  );
}
