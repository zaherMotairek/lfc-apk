/** Public site settings keys (admin-editable; seeded with safe placeholders). */
export const SITE_SETTING_KEYS = {
  paymentPayPhone: 'payment.payPhone',
  paymentPayName: 'payment.payName',
  contactPhonePlaceholder: 'contact.phonePlaceholder',
  contactWhatsappDisplay: 'contact.whatsappDisplay',
  brandSiteName: 'brand.siteName',
  brandShortName: 'brand.shortName',
  brandTagline: 'brand.tagline',
  brandThemeColor: 'brand.themeColor',
  brandRed: 'brand.red',
  brandLogoLight: 'brand.logoUrlLight',
  brandLogoDark: 'brand.logoUrlDark',
  brandIcon: 'brand.iconUrl',
  brandVersion: 'brand.version',
  featuresPredictions: 'features.predictionsEnabled',
  featuresGuestsMax: 'features.guestsMax',
  featuresPush: 'features.pushEnabled',
  socialInstagram: 'social.instagram',
  socialFacebook: 'social.facebook',
  socialX: 'social.x',
} as const;

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[keyof typeof SITE_SETTING_KEYS];

export const PUBLIC_SITE_SETTING_KEYS: SiteSettingKey[] = Object.values(SITE_SETTING_KEYS);

type SettingDefault = { value: string; description: string };

export const SITE_SETTING_DEFAULTS: Record<SiteSettingKey, SettingDefault> = {
    [SITE_SETTING_KEYS.paymentPayPhone]: {
      value: '+961 3 000 000',
      description: 'Whish/OMT payment phone shown on the membership apply page.',
    },
    [SITE_SETTING_KEYS.paymentPayName]: {
      value: 'OLSC Lebanon Treasurer',
      description: 'Payment recipient name on the membership apply page.',
    },
    [SITE_SETTING_KEYS.contactPhonePlaceholder]: {
      value: 'e.g. 70 000 000 or +961 70 000 000',
      description: 'Placeholder for phone fields on public forms.',
    },
    [SITE_SETTING_KEYS.contactWhatsappDisplay]: {
      value: '+961 3 000 000',
      description: 'WhatsApp number shown on the contact page.',
    },
    [SITE_SETTING_KEYS.brandSiteName]: {
      value: 'RedLeb Hub',
      description: 'Public site name.',
    },
    [SITE_SETTING_KEYS.brandShortName]: {
      value: 'RedLeb',
      description: 'PWA short name.',
    },
    [SITE_SETTING_KEYS.brandTagline]: {
      value: 'OLSC Lebanon',
      description: 'Logo subtitle / tagline.',
    },
    [SITE_SETTING_KEYS.brandThemeColor]: {
      value: '#c8102e',
      description: 'Browser theme colour.',
    },
    [SITE_SETTING_KEYS.brandRed]: {
      value: '#c8102e',
      description: 'Brand red accent.',
    },
    [SITE_SETTING_KEYS.brandLogoLight]: {
      value: '',
      description: 'Logo URL for light backgrounds (optional).',
    },
    [SITE_SETTING_KEYS.brandLogoDark]: {
      value: '',
      description: 'Logo URL for dark backgrounds (optional).',
    },
    [SITE_SETTING_KEYS.brandIcon]: {
      value: '',
      description: 'Square icon URL (optional).',
    },
    [SITE_SETTING_KEYS.brandVersion]: {
      value: '1',
      description: 'Cache-busting version for icons.',
    },
    [SITE_SETTING_KEYS.featuresPredictions]: {
      value: 'true',
      description: 'Enable Match Hub predictions for members.',
    },
    [SITE_SETTING_KEYS.featuresGuestsMax]: {
      value: '2',
      description: 'Max guests per event registration (0–2).',
    },
    [SITE_SETTING_KEYS.featuresPush]: {
      value: 'false',
      description: 'Enable web push notifications (requires HTTPS).',
    },
    [SITE_SETTING_KEYS.socialInstagram]: {
      value: '',
      description: 'Instagram profile URL.',
    },
    [SITE_SETTING_KEYS.socialFacebook]: {
      value: '',
      description: 'Facebook page URL.',
    },
    [SITE_SETTING_KEYS.socialX]: {
      value: '',
      description: 'X (Twitter) profile URL.',
    },
  };
