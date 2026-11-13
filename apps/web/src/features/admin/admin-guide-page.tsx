import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header';

const SECTIONS = [
  {
    title: 'Content & branding',
    items: [
      { to: '/admin/texts', label: 'Texts & Labels', hint: 'Edit buttons, menus, and member app wording.' },
      { to: '/admin/cms', label: 'CMS pages', hint: 'About, membership, committee — long-form pages.' },
      { to: '/admin/settings', label: 'Site settings', hint: 'Logo, contact, payment, feature toggles.' },
    ],
  },
  {
    title: 'Members & applications',
    items: [
      { to: '/admin/applications', label: 'Applications', hint: 'Review new membership forms.' },
      { to: '/admin/members', label: 'Users', hint: 'Invite, suspend, ALLRED ID, activity panel.' },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { to: '/admin/events', label: 'Events', hint: 'Gatherings, capacity, guest exports.' },
      { to: '/admin/news', label: 'News', hint: 'Club announcements.' },
      { to: '/admin/matches', label: 'Matches', hint: 'Fixtures, results, prediction scoring.' },
      { to: '/admin/newsletter', label: 'Newsletter', hint: 'Monthly RedLeb Dispatch PDF.' },
    ],
  },
];

export function AdminGuidePage() {
  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Committee guide"
        description="One-page map of RedLeb Hub admin tools. Share this screen with new committee members."
      />

      <p className="text-sm text-black/60">
        Operational details: see{' '}
        <code className="rounded bg-black/5 px-1">docs/OPERATIONS.md</code> and{' '}
        <code className="rounded bg-black/5 px-1">LAUNCH-CHECKLIST.md</code> in the repo.
      </p>

      {SECTIONS.map((section) => (
        <div key={section.title}>
          <h2 className="mb-3 text-lg font-bold">{section.title}</h2>
          <ul className="space-y-2">
            {section.items.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="kop-card kop-card-hover block p-4">
                  <div className="font-bold text-lfc-red">{item.label}</div>
                  <p className="mt-1 text-sm text-black/55">{item.hint}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
