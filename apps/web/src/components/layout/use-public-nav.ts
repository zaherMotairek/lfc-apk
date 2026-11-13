import { useMemo } from 'react';
import { useContent } from '../../features/content/content-provider';
import { PUBLIC_NAV_SPECS, type NavItem } from './nav-config';

export function usePublicNav(): NavItem[] {
  const about = useContent('nav.public.about', 'About');
  const committee = useContent('nav.public.committee', 'Committee');
  const events = useContent('nav.public.events', 'Events');
  const news = useContent('nav.public.news', 'News');
  const newsletter = useContent('nav.public.newsletter', 'Newsletter');
  const gallery = useContent('nav.public.gallery', 'Gallery');
  const membership = useContent('nav.public.membership', 'Membership');
  const contact = useContent('nav.public.contact', 'Contact');

  return useMemo(
    () =>
      PUBLIC_NAV_SPECS.map((spec) => {
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
        return {
          to: spec.to,
          label: labels[spec.contentKey] ?? spec.defaultLabel,
        };
      }),
    [about, committee, contact, events, gallery, membership, news, newsletter],
  );
}
