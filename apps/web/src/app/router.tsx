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
import { MatchHubPage } from '../features/members/match-hub-page';
import { LeaderboardPage } from '../features/members/leaderboard-page';
import { CommunityPage } from '../features/members/community-page';
import { NotificationsPage } from '../features/members/notifications-page';
import { HallOfFamePage } from '../features/members/hall-of-fame-page';
import { MembersDirectoryPage } from '../features/members/members-directory-page';
import { AdminDashboardPage } from '../features/admin/admin-dashboard-page';
import { AdminMembersPage } from '../features/admin/admin-members-page';
import { AdminApplicationsPage } from '../features/admin/admin-applications-page';
import { AdminCmsPage } from '../features/admin/admin-cms-page';
import { AdminNewsPage } from '../features/admin/admin-news-page';
import { AdminEventsPage } from '../features/admin/admin-events-page';
import { AdminMatchesPage } from '../features/admin/admin-matches-page';
import { AdminNewsletterPage } from '../features/admin/admin-newsletter-page';
import { AdminTextsPage } from '../features/admin/admin-texts-page';
import { AdminSiteSettingsPage } from '../features/admin/admin-site-settings-page';
import { AdminDesignPage } from '../features/admin/admin-design-page';
import { AdminAuditLogPage } from '../features/admin/admin-audit-log-page';
import { AdminGuidePage } from '../features/admin/admin-guide-page';
import { AdminModerationPage } from '../features/admin/admin-moderation-page';
import { AdminCheckInPage } from '../features/admin/admin-check-in-page';
import { NewsletterListPage } from '../features/public/newsletter-list-page';
import { NewsletterDetailPage } from '../features/public/newsletter-detail-page';

export function AppRouter() {
  return (
    <Routes>
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
          <Route path="matches/:id" element={<MatchHubPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="members" element={<MembersDirectoryPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="hall-of-fame" element={<HallOfFamePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute requireAdmin />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="members" element={<AdminMembersPage />} />
          <Route path="applications" element={<AdminApplicationsPage />} />
          <Route path="cms" element={<AdminCmsPage />} />
          <Route path="texts" element={<AdminTextsPage />} />
          <Route path="settings" element={<AdminSiteSettingsPage />} />
          <Route path="design" element={<AdminDesignPage />} />
          <Route path="guide" element={<AdminGuidePage />} />
          <Route path="audit" element={<AdminAuditLogPage />} />
          <Route path="moderation" element={<AdminModerationPage />} />
          <Route path="check-in" element={<AdminCheckInPage />} />
          <Route path="news" element={<AdminNewsPage />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="matches" element={<AdminMatchesPage />} />
          <Route path="newsletter" element={<AdminNewsletterPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
