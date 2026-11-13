import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest, apiUploadFile } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';
import { SITE_SETTING_KEYS } from '../../lib/site-settings';
import { useToast } from '../../components/ui/toast-provider';
import { resolveMediaUrl } from '../../lib/media-url';

type SettingRow = {
  key: string;
  value: string;
  defaultValue: string;
  description?: string | null;
  isOverridden: boolean;
};

const BRAND_IMAGE_KEYS = new Set(['brand.logoUrlLight', 'brand.logoUrlDark', 'brand.iconUrl']);

const TABS: Array<{ id: string; label: string; keys: string[] }> = [
  {
    id: 'branding',
    label: 'Branding',
    keys: [
      'brand.siteName',
      'brand.shortName',
      'brand.tagline',
      'brand.red',
      'brand.themeColor',
      'brand.logoUrlLight',
      'brand.logoUrlDark',
      'brand.iconUrl',
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    keys: [SITE_SETTING_KEYS.contactWhatsappDisplay, SITE_SETTING_KEYS.contactPhonePlaceholder],
  },
  {
    id: 'payment',
    label: 'Payment',
    keys: [SITE_SETTING_KEYS.paymentPayPhone, SITE_SETTING_KEYS.paymentPayName],
  },
  {
    id: 'features',
    label: 'Features',
    keys: ['features.predictionsEnabled', 'features.guestsMax', 'features.pushEnabled'],
  },
  {
    id: 'social',
    label: 'Social',
    keys: ['social.instagram', 'social.facebook', 'social.x'],
  },
];

export function AdminSiteSettingsPage() {
  const showToast = useToast();
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('branding');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: ['admin-site-settings'],
    queryFn: () => apiRequest<SettingRow[]>('/admin/site-settings', { token: accessToken }),
    enabled: Boolean(accessToken),
  });

  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];
  const rows = useMemo(() => {
    const all = settingsQuery.data ?? [];
    return all.filter((row) => activeTab.keys.includes(row.key));
  }, [settingsQuery.data, activeTab.keys]);

  const saveMutation = useMutation({
    mutationFn: (settings: Array<{ key: string; value: string }>) =>
      apiRequest<{ message: string }>('/admin/site-settings', {
        method: 'PUT',
        token: accessToken,
        body: { settings },
      }),
    onSuccess: (res) => {
      setMessage(res.message);
      showToast(res.message, 'success');
      setDraft({});
      void queryClient.invalidateQueries({ queryKey: ['admin-site-settings'] });
      void queryClient.invalidateQueries({ queryKey: ['brand'] });
      void queryClient.invalidateQueries({ queryKey: ['site-settings-public'] });
    },
    onError: (err) => setMessage(err instanceof Error ? err.message : 'Save failed'),
  });

  async function onBrandUpload(key: string, file: File) {
    setUploadingKey(key);
    setMessage(null);
    try {
      const result = await apiUploadFile<{ url: string; message: string }>(
        '/admin/site-settings/upload-brand-image',
        file,
        accessToken,
      );
      setDraft((prev) => ({ ...prev, [key]: result.url }));
      setMessage(result.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingKey(null);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const settings = rows.map((row) => ({
      key: row.key,
      value: draft[row.key] ?? row.value,
    }));
    saveMutation.mutate(settings);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Site settings"
        description="Branding, contact details, and payment instructions — no code changes needed."
      />

      {message ? (
        <div className="rounded-xl border border-pitch/20 bg-pitch/5 px-4 py-3 text-sm text-pitch">{message}</div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'kop-btn-primary !text-sm' : 'kop-btn-secondary !text-sm'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="kop-card space-y-4 p-5">
        {rows.map((row) => {
          const value = draft[row.key] ?? row.value;
          const isImage = BRAND_IMAGE_KEYS.has(row.key);
          return (
            <div key={row.key} className="block text-sm font-medium">
              <span>{row.description ?? row.key}</span>
              {isImage && value ? (
                <img
                  src={resolveMediaUrl(value)}
                  alt=""
                  className="mt-2 h-14 max-w-[200px] object-contain"
                />
              ) : null}
              <input
                className="kop-input mt-1 font-mono text-xs"
                value={value}
                onChange={(e) => setDraft((p) => ({ ...p, [row.key]: e.target.value }))}
              />
              {isImage ? (
                <label className="mt-2 inline-block cursor-pointer text-xs font-semibold text-lfc-red">
                  {uploadingKey === row.key ? 'Uploading…' : 'Upload image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={Boolean(uploadingKey)}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void onBrandUpload(row.key, file);
                      e.target.value = '';
                    }}
                  />
                </label>
              ) : null}
              {row.isOverridden ? (
                <span className="mt-1 block text-xs text-black/45">Default: {row.defaultValue}</span>
              ) : null}
            </div>
          );
        })}
        {settingsQuery.isLoading ? <p className="text-sm text-black/45">Loading…</p> : null}
        <button type="submit" className="kop-btn-primary" disabled={saveMutation.isPending || !rows.length}>
          Save {activeTab.label}
        </button>
      </form>
    </section>
  );
}
