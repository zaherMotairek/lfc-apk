import { useMemo } from 'react';
import { useContent } from '../../features/content/content-provider';
import { useFeatureFlags } from '../../features/site/use-feature-flags';
import { applyNavOrder } from '../../lib/nav-order';
import { SITE_SETTING_KEYS } from '../../lib/site-settings';
import { PUBLIC_NAV_SPECS, type NavItem } from './nav-config';

export function usePublicNav(): NavItem[] {
  const { settings } = useFeatureFlags();
  const about = useContent('nav.public.about', 'About');
  const committee = useContent('nav.public.committee', 'Committee');
  const events = useContent('nav.public.events', 'Events');
  const news = useContent('nav.public.news', 'News');
  const newsletter = useContent('nav.public.newsletter', 'Newsletter');
  const gallery = useContent('nav.public.gallery', 'Gallery');
  const membership = useContent('nav.public.membership', 'Membership');
  const contact = useContent('nav.public.contact', 'Contact');

  return useMemo(() => {
    const specs = applyNavOrder(
      PUBLIC_NAV_SPECS,
      settings[SITE_SETTING_KEYS.navPublicOrder],
      settings[SITE_SETTING_KEYS.navPublicHidden],
    );
    const labels: Record<string, string> = {
      'nav.public.about': about,
      'nav.public.committee': committee,
      'nav.public.events': events,
      'nav.public.news': news,
      'nav.public.newsletter': newsletter,
      'nav.public.gallery': gallery,
      'nav.public.membership': membership,
      'nav.public.contact': contact,
    };
    return specs.map((spec) => ({
      to: spec.to,
      label: labels[spec.contentKey] ?? spec.defaultLabel,
    }));
  }, [about, committee, contact, events, gallery, membership, news, newsletter, settings]);
}
