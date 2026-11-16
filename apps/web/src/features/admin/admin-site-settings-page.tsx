import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest, apiUploadFile } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';
import { SITE_SETTING_KEYS } from '../../lib/site-settings';
import { useToast } from '../../components/ui/toast-provider';
import { resolveMediaUrl } from '../../lib/media-url';
import { AdminPushBroadcastPanel } from './admin-push-broadcast-panel';
import { SettingToggle } from '../../components/ui/setting-toggle';

type SettingRow = {
  key: string;
  value: string;
  defaultValue: string;
  description?: string | null;
  isOverridden: boolean;
};

const BRAND_IMAGE_KEYS = new Set(['brand.logoUrlLight', 'brand.logoUrlDark', 'brand.iconUrl']);

const BRAND_IMAGE_LABELS: Record<string, { title: string; hint: string }> = {
  'brand.logoUrlLight': {
    title: 'Logo (light background)',
    hint: 'Header on the public site — PNG or SVG with transparent background works best.',
  },
  'brand.logoUrlDark': {
    title: 'Logo (dark background)',
    hint: 'Optional — used on dark headers if you upload one.',
  },
  'brand.iconUrl': {
    title: 'App icon (square)',
    hint: 'Phone home screen / browser tab — square image, at least 192×192 px.',
  },
};

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
    keys: [
      'features.predictionsEnabled',
      'features.matchLiveEnabled',
      'features.guestsMax',
      'features.pushEnabled',
    ],
  },
  {
    id: 'social',
    label: 'Social',
    keys: ['social.instagram', 'social.facebook', 'social.x'],
  },
  {
    id: 'navigation',
    label: 'Navigation',
    keys: [
      SITE_SETTING_KEYS.navPublicOrder,
      SITE_SETTING_KEYS.navPublicHidden,
      SITE_SETTING_KEYS.navMemberMainOrder,
      SITE_SETTING_KEYS.navMemberExtraOrder,
      SITE_SETTING_KEYS.navMemberTabOrder,
      SITE_SETTING_KEYS.navAdminOrder,
      SITE_SETTING_KEYS.navAdminHidden,
      SITE_SETTING_KEYS.navAdminTabOrder,
    ],
  },
];

const MULTILINE_SETTING_KEYS = new Set<string>([
  SITE_SETTING_KEYS.navPublicOrder,
  SITE_SETTING_KEYS.navPublicHidden,
  SITE_SETTING_KEYS.navMemberMainOrder,
  SITE_SETTING_KEYS.navMemberExtraOrder,
  SITE_SETTING_KEYS.navMemberTabOrder,
  SITE_SETTING_KEYS.navAdminOrder,
  SITE_SETTING_KEYS.navAdminHidden,
  SITE_SETTING_KEYS.navAdminTabOrder,
]);

const BOOLEAN_SETTING_KEYS = new Set([
  'features.predictionsEnabled',
  'features.matchLiveEnabled',
  'features.pushEnabled',
]);

const COLOR_SETTING_KEYS = new Set(['brand.red', 'brand.themeColor']);

/** Stored as the strings "true" / "false" in the database — UI uses toggles instead of typing. */
function isSettingOn(key: string, value: string): boolean {
  if (key === 'features.predictionsEnabled') return value !== 'false';
  return value === 'true';
}

function settingOnOff(key: string, on: boolean): string {
  if (key === 'features.predictionsEnabled') return on ? 'true' : 'false';
  return on ? 'true' : 'false';
}

export function AdminSiteSettingsPage() {
  const showToast = useToast();
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('branding');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [showUrlFor, setShowUrlFor] = useState<Record<string, boolean>>({});

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
      const slot =
        key === 'brand.iconUrl' ? '?slot=icon' : '';
      const result = await apiUploadFile<{ url: string; message: string }>(
        `/admin/site-settings/upload-brand-image${slot}`,
        file,
        accessToken,
      );
      setDraft((prev) => ({ ...prev, [key]: result.url }));
      setMessage(`${result.message} — click “Save Branding” below to publish on the live site.`);
      showToast('Image uploaded — remember to save', 'success');
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

      {tab === 'branding' ? (
        <div className="kop-card border-dashed border-lfc-red/25 bg-lfc-red/[0.03] p-4 text-sm text-black/65">
          <strong className="text-ink">Logos &amp; icon:</strong> use the big{' '}
          <strong className="text-lfc-red">Choose image</strong> buttons below — not the colour text boxes. After each
          upload, press <strong className="text-ink">Save Branding</strong>.
        </div>
      ) : null}
      {tab === 'features' ? (
        <div className="kop-card border border-black/10 bg-black/[0.02] p-4 text-sm text-black/60">
          Use the <strong className="text-ink">switches</strong> and the guests <strong className="text-ink">menu</strong>{' '}
          — you do not type the words &quot;true&quot; or &quot;false&quot;. Then <strong className="text-ink">Save Features</strong>.
        </div>
      ) : null}
      {tab === 'navigation' ? (
        <div className="kop-card border-amber-500/30 bg-amber-500/[0.06] p-4 text-sm text-black/65">
          <strong className="text-ink">Technical area.</strong> These fields reorder menu items using internal codes. If you
          are not sure, leave them unchanged and ask your tech helper — wrong values can hide menu links.
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="kop-card space-y-4 p-5">
        {rows.map((row) => {
          const value = draft[row.key] ?? row.value;
          const isImage = BRAND_IMAGE_KEYS.has(row.key);
          const imageMeta = BRAND_IMAGE_LABELS[row.key];

          if (isImage) {
            return (
              <div
                key={row.key}
                className="rounded-2xl border border-black/10 bg-black/[0.02] p-4"
              >
                <div className="text-base font-bold text-ink">{imageMeta?.title ?? row.description}</div>
                <p className="mt-1 text-xs text-black/50">{imageMeta?.hint ?? row.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  {value ? (
                    <img
                      src={resolveMediaUrl(value)}
                      alt=""
                      className="h-16 max-w-[220px] rounded-lg border border-black/10 bg-white object-contain p-2"
                    />
                  ) : (
                    <div className="flex h-16 w-28 items-center justify-center rounded-lg border border-dashed border-black/15 bg-white text-xs text-black/40">
                      No image yet
                    </div>
                  )}
                  <label className="kop-btn-primary cursor-pointer !text-sm">
                    {uploadingKey === row.key ? 'Uploading…' : value ? 'Replace image' : 'Choose image'}
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
                </div>
                <button
                  type="button"
                  className="mt-3 text-xs font-semibold text-black/45 underline-offset-2 hover:text-lfc-red hover:underline"
                  onClick={() => setShowUrlFor((p) => ({ ...p, [row.key]: !p[row.key] }))}
                >
                  {showUrlFor[row.key] ? 'Hide technical URL' : 'Advanced: paste image URL'}
                </button>
                {showUrlFor[row.key] ? (
                  <input
                    className="kop-input mt-2 font-mono text-xs"
                    value={value}
                    onChange={(e) => setDraft((p) => ({ ...p, [row.key]: e.target.value }))}
                    placeholder="https://…"
                  />
                ) : null}
              </div>
            );
          }

          if (BOOLEAN_SETTING_KEYS.has(row.key)) {
            const on = isSettingOn(row.key, value);
            return (
              <SettingToggle
                key={row.key}
                label={row.description ?? row.key}
                on={on}
                onChange={(next) =>
                  setDraft((p) => ({ ...p, [row.key]: settingOnOff(row.key, next) }))
                }
              />
            );
          }

          if (row.key === 'features.guestsMax') {
            const n = String(Math.min(2, Math.max(0, Number(value) || 0)));
            return (
              <div key={row.key} className="block text-sm font-medium">
                <span>{row.description ?? row.key}</span>
                <select
                  className="kop-input mt-1 max-w-xs"
                  value={n}
                  onChange={(e) => setDraft((p) => ({ ...p, [row.key]: e.target.value }))}
                >
                  <option value="0">No guests</option>
                  <option value="1">Up to 1 guest</option>
                  <option value="2">Up to 2 guests</option>
                </select>
              </div>
            );
          }

          if (COLOR_SETTING_KEYS.has(row.key)) {
            const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : '#c8102e';
            return (
              <div key={row.key} className="block text-sm font-medium">
                <span>{row.description ?? row.key}</span>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <input
                    type="color"
                    className="h-10 w-14 cursor-pointer rounded-lg border border-black/10"
                    value={hex}
                    onChange={(e) => setDraft((p) => ({ ...p, [row.key]: e.target.value }))}
                  />
                  <span className="font-mono text-xs text-black/55">{draft[row.key] ?? value}</span>
                </div>
              </div>
            );
          }

          return (
            <div key={row.key} className="block text-sm font-medium">
              <span>{row.description ?? row.key}</span>
              {MULTILINE_SETTING_KEYS.has(row.key) ? (
                <textarea
                  className="kop-input mt-1 min-h-[4.5rem] font-mono text-xs"
                  rows={3}
                  value={value}
                  onChange={(e) => setDraft((p) => ({ ...p, [row.key]: e.target.value }))}
                />
              ) : (
                <input
                  className="kop-input mt-1 text-sm"
                  value={value}
                  onChange={(e) => setDraft((p) => ({ ...p, [row.key]: e.target.value }))}
                />
              )}
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

      {tab === 'features' ? <AdminPushBroadcastPanel /> : null}
    </section>
  );
}
