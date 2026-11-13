import { apiRequest } from './api';

export type PublicSiteSettings = Record<string, string>;

export function fetchPublicSiteSettings() {
  return apiRequest<PublicSiteSettings>('/site-settings/public');
}

export const SITE_SETTING_KEYS = {
  paymentPayPhone: 'payment.payPhone',
  paymentPayName: 'payment.payName',
  contactPhonePlaceholder: 'contact.phonePlaceholder',
  contactWhatsappDisplay: 'contact.whatsappDisplay',
  brandSiteName: 'brand.siteName',
  brandShortName: 'brand.shortName',
  brandTagline: 'brand.tagline',
  brandRed: 'brand.red',
  brandThemeColor: 'brand.themeColor',
  brandLogoLight: 'brand.logoUrlLight',
  brandLogoDark: 'brand.logoUrlDark',
  brandIcon: 'brand.iconUrl',
  navPublicOrder: 'nav.public.order',
  navPublicHidden: 'nav.public.hidden',
  navMemberMainOrder: 'nav.member.mainOrder',
  navMemberExtraOrder: 'nav.member.extraOrder',
  navMemberTabOrder: 'nav.member.tabOrder',
  navAdminOrder: 'nav.admin.order',
  navAdminHidden: 'nav.admin.hidden',
  navAdminTabOrder: 'nav.admin.tabOrder',
} as const;
