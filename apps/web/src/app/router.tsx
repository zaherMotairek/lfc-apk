import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from '../layouts/public-layout';
import { MemberLayout } from '../layouts/member-layout';
import { AdminLayout } from '../layouts/admin-layout';
import { ProtectedRoute } from './protected-route';
import { HomePage } from '../features/public/home-page';
import { CommitteePublicPage } from '../features/public/committee-public-page';
import { ContactPublicPage } from '../features/public/contact-public-page';
import { AboutPublicPage } from '../features/public/about-public-page';
import { MembershipPublicPage } from '../features/public/membership-public-page';
import { MembershipApplyPage } from '../features/public/membership-apply-page';
import { NewsListPage } from '../features/public/news-list-page';
import { NewsDetailPage } from '../features/public/news-detail-page';
import { EventsListPage } from '../features/public/events-list-page';
import { EventDetailPage } from '../features/public/event-detail-page';
import { GalleryPage } from '../features/public/gallery-page';
import { GalleryAlbumPage } from '../features/public/gallery-album-page';
import { LoginPage } from '../features/auth/login-page';
import { SignupPage } from '../features/auth/signup-page';
import { AcceptInvitationPage } from '../features/auth/accept-invitation-page';
import { ForgotPasswordPage } from '../features/auth/forgot-password-page';
import { ResetPasswordPage } from '../features/auth/reset-password-page';
import { MemberHomePage } from '../features/members/member-home-page';
import { MembershipCardPage } from '../features/members/membership-card-page';
import { ProfilePage } from '../features/members/profile-page';
import { MatchesListPage } from '../features/members/matches-list-page';
import { LeaderboardPage } from '../features/members/leaderboard-page';
import { CommunityPage } from '../features/members/community-page';
import { NotificationsPage } from '../features/members/notifications-page';
import { HallOfFamePage } from '../features/members/hall-of-fame-page';
import { MembersDirectoryPage } from '../features/members/members-directory-page';
import { NewsletterListPage } from '../features/public/newsletter-list-page';
import { NewsletterDetailPage } from '../features/public/newsletter-detail-page';
import { OfflinePage } from '../features/public/offline-page';
import {
  AdminApplicationsPage,
  AdminAuditLogPage,
  AdminCheckInPage,
  AdminCmsPage,
  AdminDashboardPage,
  AdminDesignPage,
  AdminEventsPage,
  AdminGuidePage,
  AdminMatchesPage,
  AdminMembersPage,
  AdminModerationPage,
  AdminNewsletterPage,
  AdminNewsPage,
  AdminSiteSettingsPage,
  AdminTextsPage,
  MatchHubPage,
  withPageSuspense,
} from './lazy-pages';

export function AppRouter() {
  return (
    <Routes>
      <Route path="offline" element={<OfflinePage />} />
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPublicPage />} />
        <Route path="committee" element={<CommitteePublicPage />} />
        <Route path="events" element={<EventsListPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="gallery/:id" element={<GalleryAlbumPage />} />
        <Route path="news" element={<NewsListPage />} />
        <Route path="news/:slug" element={<NewsDetailPage />} />
        <Route path="newsletter" element={<NewsletterListPage />} />
        <Route path="newsletter/:slug" element={<NewsletterDetailPage />} />
        <Route path="membership" element={<MembershipPublicPage />} />
        <Route path="membership/apply" element={<MembershipApplyPage />} />
        <Route path="contact" element={<ContactPublicPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="accept-invitation" element={<AcceptInvitationPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="app" element={<MemberLayout />}>
          <Route index element={<MemberHomePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="membership-card" element={<MembershipCardPage />} />
          <Route path="matches" element={<MatchesListPage />} />
          <Route path="matches/:id" element={withPageSuspense(<MatchHubPage />)} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="members" element={<MembersDirectoryPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="hall-of-fame" element={<HallOfFamePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute requireAdmin />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={withPageSuspense(<AdminDashboardPage />)} />
          <Route path="members" element={withPageSuspense(<AdminMembersPage />)} />
          <Route path="applications" element={withPageSuspense(<AdminApplicationsPage />)} />
          <Route path="cms" element={withPageSuspense(<AdminCmsPage />)} />
          <Route path="texts" element={withPageSuspense(<AdminTextsPage />)} />
          <Route path="settings" element={withPageSuspense(<AdminSiteSettingsPage />)} />
          <Route path="design" element={withPageSuspense(<AdminDesignPage />)} />
          <Route path="guide" element={withPageSuspense(<AdminGuidePage />)} />
          <Route path="audit" element={withPageSuspense(<AdminAuditLogPage />)} />
          <Route path="moderation" element={withPageSuspense(<AdminModerationPage />)} />
          <Route path="check-in" element={withPageSuspense(<AdminCheckInPage />)} />
          <Route path="news" element={withPageSuspense(<AdminNewsPage />)} />
          <Route path="events" element={withPageSuspense(<AdminEventsPage />)} />
          <Route path="matches" element={withPageSuspense(<AdminMatchesPage />)} />
          <Route path="newsletter" element={withPageSuspense(<AdminNewsletterPage />)} />
        </Route>
      </Route>
    </Routes>
  );
}
