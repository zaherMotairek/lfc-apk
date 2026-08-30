import type { ContactChannel } from './cms-types';

export const DEFAULT_CONTACT_INTRO =
  'Have a question about membership, events, or the Kop Platform? The OLSC Lebanon committee is here to help. Reach out through any channel below — we aim to respond within a few business days.';

export const DEFAULT_CONTACT_CHANNELS: ContactChannel[] = [
  {
    icon: '✉️',
    label: 'Email',
    value: 'info@olsclebanon.com',
    href: 'mailto:info@olsclebanon.com',
  },
  {
    icon: '📱',
    label: 'WhatsApp',
    value: '+961 3 000 000',
    href: 'https://wa.me/9613000000',
  },
  {
    icon: '📸',
    label: 'Instagram',
    value: '@olsclebanon',
    href: 'https://instagram.com/olsclebanon',
  },
  {
    icon: '📍',
    label: 'Based in',
    value: 'Beirut, Lebanon',
  },
];
