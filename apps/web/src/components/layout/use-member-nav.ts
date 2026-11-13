import { useMemo } from 'react';
import { useContent, useContentBundle } from '../../features/content/content-provider';
import { useFeatureFlags } from '../../features/site/use-feature-flags';
import { applyNavOrder } from '../../lib/nav-order';
import { SITE_SETTING_KEYS } from '../../lib/site-settings';
import {
  MEMBER_EXTRA_NAV_SPECS,
  MEMBER_MOBILE_TAB_SPECS,
  MEMBER_NAV_SPECS,
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

export function useMemberNav(options: { predictionsEnabled: boolean; includeAdminLink: boolean }) {
  const bundle = useContentBundle();
  const { settings } = useFeatureFlags();
  const resolve = (key: string, fallback: string) => bundle[key] ?? fallback;

  const adminPanel = useContent('nav.adminPanel', 'Admin Panel');
  const adminShort = useContent('nav.member.adminShort', 'Admin');
  const shellTitle = useContent('nav.member.shellTitle', 'RedLeb Hub');
  const shellSubtitle = useContent('nav.member.shellSubtitle', 'OLSC Lebanon · Member App');
  const footerPublic = useContent('nav.member.footerPublic', '← Public website');
  const logoutLabel = useContent('nav.member.logout', 'Logout');

  const mainNav = useMemo(() => {
    const specs = applyNavOrder(
      MEMBER_NAV_SPECS,
      settings[SITE_SETTING_KEYS.navMemberMainOrder],
      undefined,
    );
    let items = mapSpecsToNav(specs, resolve);
    if (!options.predictionsEnabled) {
      items = items.filter((item) => item.to !== '/app/matches');
    }
    return items;
  }, [bundle, options.predictionsEnabled, settings]);

  const extraNav = useMemo(() => {
    const specs = applyNavOrder(
      MEMBER_EXTRA_NAV_SPECS,
      settings[SITE_SETTING_KEYS.navMemberExtraOrder],
      undefined,
    );
    return mapSpecsToNav(specs, resolve);
  }, [bundle, settings]);

  const mobileTabs = useMemo(() => {
    const specs = applyNavOrder(
      MEMBER_MOBILE_TAB_SPECS,
      settings[SITE_SETTING_KEYS.navMemberTabOrder],
      undefined,
    );
    let tabs = mapSpecsToNav(specs, resolve);
    if (!options.predictionsEnabled) {
      tabs = tabs.filter((item) => item.to !== '/app/matches');
    }
    return tabs;
  }, [bundle, options.predictionsEnabled, settings]);

  const drawerNav = useMemo(() => {
    const items = [...mainNav, ...extraNav];
    if (options.includeAdminLink) {
      items.push({ to: '/admin', label: adminPanel, icon: '⚙️' });
    }
    return items;
  }, [adminPanel, extraNav, mainNav, options.includeAdminLink]);

  return {
    mainNav,
    extraNav,
    mobileTabs,
    drawerNav,
    adminShort,
    shellTitle,
    shellSubtitle,
    footerPublic,
    logoutLabel,
  };
}
