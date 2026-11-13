import { useMemo } from 'react';
import { useContent, useContentBundle } from '../../features/content/content-provider';
import { useFeatureFlags } from '../../features/site/use-feature-flags';
import { applyNavOrder } from '../../lib/nav-order';
import { SITE_SETTING_KEYS } from '../../lib/site-settings';
import {
  ADMIN_MOBILE_TAB_SPECS,
  ADMIN_NAV_SPECS,
  type MemberNavSpec,
  type NavItem,
} from './nav-config';

function mapSpecsToNav(specs: MemberNavSpec[], resolve: (key: string, fallback: string) => string): NavItem[] {
  return specs.map((spec) => ({
    to: spec.to,
    label: resolve(spec.contentKey, spec.defaultLabel),
    icon: spec.icon,
    end: spec.end,
  }));
}

export function useAdminNav() {
  const bundle = useContentBundle();
  const { settings } = useFeatureFlags();
  const resolve = (key: string, fallback: string) => bundle[key] ?? fallback;

  const shellTitle = useContent('nav.admin.shellTitle', 'Admin Panel');
  const shellSubtitle = useContent('nav.admin.shellSubtitle', 'OLSC Lebanon Committee');
  const footerMember = useContent('nav.admin.footerMember', '← Member App');
  const footerPublic = useContent('nav.admin.footerPublic', '← Public website');
  const logoutLabel = useContent('nav.admin.logout', 'Logout');
  const headerTagline = useContent('nav.admin.headerTagline', 'Committee Control Center');
  const memberAppShort = useContent('nav.memberApp', 'Member App');

  const sidebarNav = useMemo(() => {
    const specs = applyNavOrder(
      ADMIN_NAV_SPECS,
      settings[SITE_SETTING_KEYS.navAdminOrder],
      settings[SITE_SETTING_KEYS.navAdminHidden],
    );
    return mapSpecsToNav(specs, resolve);
  }, [bundle, settings]);

  const mobileTabs = useMemo(() => {
    const specs = applyNavOrder(
      ADMIN_MOBILE_TAB_SPECS,
      settings[SITE_SETTING_KEYS.navAdminTabOrder],
      undefined,
    );
    return mapSpecsToNav(specs, resolve);
  }, [bundle, settings]);

  return {
    sidebarNav,
    mobileTabs,
    shellTitle,
    shellSubtitle,
    footerMember,
    footerPublic,
    logoutLabel,
    headerTagline,
    memberAppShort,
  };
}
