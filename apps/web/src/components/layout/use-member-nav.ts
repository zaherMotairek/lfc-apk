import { useMemo } from 'react';
import { useContent, useContentBundle } from '../../features/content/content-provider';
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
  const resolve = (key: string, fallback: string) => bundle[key] ?? fallback;

  const adminPanel = useContent('nav.adminPanel', 'Admin Panel');
  const adminShort = useContent('nav.member.adminShort', 'Admin');
  const shellTitle = useContent('nav.member.shellTitle', 'RedLeb Hub');
  const shellSubtitle = useContent('nav.member.shellSubtitle', 'OLSC Lebanon · Member App');
  const footerPublic = useContent('nav.member.footerPublic', '← Public website');
  const logoutLabel = useContent('nav.member.logout', 'Logout');

  const mainNav = useMemo(() => {
    let items = mapSpecsToNav(MEMBER_NAV_SPECS, resolve);
    if (!options.predictionsEnabled) {
      items = items.filter((item) => item.to !== '/app/matches');
    }
    return items;
  }, [bundle, options.predictionsEnabled]);

  const extraNav = useMemo(() => mapSpecsToNav(MEMBER_EXTRA_NAV_SPECS, resolve), [bundle]);

  const mobileTabs = useMemo(() => {
    let tabs = mapSpecsToNav(MEMBER_MOBILE_TAB_SPECS, resolve);
    if (!options.predictionsEnabled) {
      tabs = tabs.filter((item) => item.to !== '/app/matches');
    }
    return tabs;
  }, [bundle, options.predictionsEnabled]);

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
