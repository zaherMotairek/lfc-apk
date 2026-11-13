import { lazy, Suspense, type ReactNode } from 'react';
import { PageSpinner } from '../components/ui/page-spinner';

export const AdminDashboardPage = lazy(() =>
  import('../features/admin/admin-dashboard-page').then((m) => ({ default: m.AdminDashboardPage })),
);
export const AdminMembersPage = lazy(() =>
  import('../features/admin/admin-members-page').then((m) => ({ default: m.AdminMembersPage })),
);
export const AdminApplicationsPage = lazy(() =>
  import('../features/admin/admin-applications-page').then((m) => ({ default: m.AdminApplicationsPage })),
);
export const AdminCmsPage = lazy(() =>
  import('../features/admin/admin-cms-page').then((m) => ({ default: m.AdminCmsPage })),
);
export const AdminNewsPage = lazy(() =>
  import('../features/admin/admin-news-page').then((m) => ({ default: m.AdminNewsPage })),
);
export const AdminEventsPage = lazy(() =>
  import('../features/admin/admin-events-page').then((m) => ({ default: m.AdminEventsPage })),
);
export const AdminMatchesPage = lazy(() =>
  import('../features/admin/admin-matches-page').then((m) => ({ default: m.AdminMatchesPage })),
);
export const AdminNewsletterPage = lazy(() =>
  import('../features/admin/admin-newsletter-page').then((m) => ({ default: m.AdminNewsletterPage })),
);
export const AdminTextsPage = lazy(() =>
  import('../features/admin/admin-texts-page').then((m) => ({ default: m.AdminTextsPage })),
);
export const AdminSiteSettingsPage = lazy(() =>
  import('../features/admin/admin-site-settings-page').then((m) => ({ default: m.AdminSiteSettingsPage })),
);
export const AdminDesignPage = lazy(() =>
  import('../features/admin/admin-design-page').then((m) => ({ default: m.AdminDesignPage })),
);
export const AdminAuditLogPage = lazy(() =>
  import('../features/admin/admin-audit-log-page').then((m) => ({ default: m.AdminAuditLogPage })),
);
export const AdminGuidePage = lazy(() =>
  import('../features/admin/admin-guide-page').then((m) => ({ default: m.AdminGuidePage })),
);
export const AdminModerationPage = lazy(() =>
  import('../features/admin/admin-moderation-page').then((m) => ({ default: m.AdminModerationPage })),
);
export const AdminCheckInPage = lazy(() =>
  import('../features/admin/admin-check-in-page').then((m) => ({ default: m.AdminCheckInPage })),
);

export const MatchHubPage = lazy(() =>
  import('../features/members/match-hub-page').then((m) => ({ default: m.MatchHubPage })),
);

export function withPageSuspense(page: ReactNode) {
  return <Suspense fallback={<PageSpinner />}>{page}</Suspense>;
}
