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
} as const;
