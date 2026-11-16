#!/usr/bin/env node
/**
 * Extra public + editing shots for committee PDF (merged into shots-manifest.json).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium, devices } from '@playwright/test';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(root, 'docs/committee-presentation/shots');
const AUTH_DIR = path.join(root, 'docs/committee-presentation/.auth');
const MANIFEST_PATH = path.join(root, 'docs/committee-presentation/shots-manifest.json');
const SNAP_PATH = path.join(root, 'docs/committee-presentation/content-snapshot.json');
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const API = BASE.replace('5173', '3000');

const MOBILE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent: devices['Pixel 5'].userAgent,
};
const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };

async function stabilize(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(500);
  await page.locator('.animate-pulse').first().waitFor({ state: 'hidden', timeout: 12_000 }).catch(() => {});
}

async function assertPublic(page, label) {
  const authPage = /login|signup|forgot|reset-password|accept-invitation/i.test(label);
  const url = page.url();
  if (url.includes('/login') && !authPage && !url.includes('forgot')) {
    throw new Error(`${label}: unexpected login`);
  }
  if (authPage) return;
  const signIn = page.getByRole('heading', { name: /Sign in to RedLeb Hub/i });
  if (await signIn.isVisible().catch(() => false)) {
    throw new Error(`${label}: login heading visible`);
  }
}

async function collectMarkers(page, defs) {
  const vp = page.viewportSize();
  if (!vp) return [];
  const markers = [];
  for (const d of defs) {
    let el = d.sel ? page.locator(d.sel).first() : page.getByRole(d.role, { name: d.name }).first();
    if (!(await el.isVisible().catch(() => false))) continue;
    const box = await el.boundingBox();
    if (!box) continue;
    markers.push({
      n: markers.length + 1,
      label: d.label,
      xPct: ((box.x + box.width / 2) / vp.width) * 100,
      yPct: ((box.y + box.height / 2) / vp.height) * 100,
    });
  }
  return markers;
}

async function captureOne(page, manifest, errors, id, file, action, opts = {}) {
  try {
    await action();
    await stabilize(page);
    await assertPublic(page, id);
    if (opts.expectPath && !page.url().includes(opts.expectPath)) {
      throw new Error(`${id}: expected ${opts.expectPath}, got ${page.url()}`);
    }
    const markerData = opts.markers?.length ? await collectMarkers(page, opts.markers) : [];
    if (opts.fullPage) {
      await page.screenshot({ path: path.join(OUT_DIR, file), fullPage: true });
    } else {
      await page.screenshot({ path: path.join(OUT_DIR, file) });
    }
    manifest.shots[id] = { file, markers: markerData, url: page.url() };
    console.log(`  ✓ ${file}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push({ id, file, msg });
    console.error(`  ✗ ${file}: ${msg}`);
  }
}

async function scrollPair(mPage, dPage, manifest, errors, baseId, baseName, url, markers = []) {
  const runScroll = async (page, suffix, keyPrefix) => {
    await page.goto(url);
    await stabilize(page);
    await assertPublic(page, keyPrefix);
    const markerData = suffix === 'top' && markers.length ? await collectMarkers(page, markers) : [];
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    const topFile = `${baseName}-${suffix}-top.png`;
    await page.screenshot({ path: path.join(OUT_DIR, topFile) });
    manifest.shots[`${keyPrefix}-top`] = { file: topFile, markers: markerData, url: page.url() };
    console.log(`  ✓ ${topFile}`);
    await page.evaluate(() => window.scrollTo(0, Math.min(520, document.body.scrollHeight)));
    await page.waitForTimeout(250);
    const midFile = `${baseName}-${suffix}-mid.png`;
    await page.screenshot({ path: path.join(OUT_DIR, midFile) });
    manifest.shots[`${keyPrefix}-mid`] = { file: midFile, markers: [], url: page.url() };
    console.log(`  ✓ ${midFile}`);
  };
  try {
    await runScroll(mPage, 'm', `${baseId}-m`);
    await runScroll(dPage, 'd', `${baseId}-d`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push({ id: baseId, msg });
    console.error(`  ✗ ${baseName}: ${msg}`);
  }
}

function demoPaths() {
  if (fs.existsSync(SNAP_PATH)) {
    const snap = JSON.parse(fs.readFileSync(SNAP_PATH, 'utf8'));
    return snap.demo ?? {};
  }
  return {};
}

export async function captureWebsiteExpansion(browser, manifest, errors = []) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const demo = demoPaths();

  let albumId = demo.albumId;
  let eventId = demo.eventId;
  let newsSlug = demo.newsSlug ?? 'demo-kop-win';
  let newsletterSlug = demo.newsletterSlug;

  if (!albumId || !eventId || !newsletterSlug) {
    const [gal, ev, nl] = await Promise.all([
      fetch(`${API}/api/gallery`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API}/api/events`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API}/api/newsletters`).then((r) => (r.ok ? r.json() : [])),
    ]);
    albumId = albumId ?? gal?.find?.((a) => a.title?.includes('Demo Kop'))?.id ?? gal?.[0]?.id;
    eventId = eventId ?? ev?.find?.((e) => e.title?.includes('Committee Demo'))?.id ?? ev?.[0]?.id;
    newsletterSlug = newsletterSlug ?? nl?.[0]?.slug;
  }

  const mobileCtx = await browser.newContext(MOBILE);
  const deskCtx = await browser.newContext(DESKTOP);
  const mob = await mobileCtx.newPage();
  const desk = await deskCtx.newPage();

  console.log('Website expansion — public pages…');

  const homeMarkers = [
    { role: 'heading', name: /Welcome to OLSC/i, label: 'Main welcome title' },
    { role: 'link', name: /Become a member/i, label: 'Primary call-to-action' },
  ];
  await scrollPair(mob, desk, manifest, errors, 'webpub-home', 'webpub-home', `${BASE}/`, homeMarkers);

  const longPages = [
    ['webpub-about', 'webpub-about', '/about'],
    ['webpub-committee', 'webpub-committee', '/committee'],
    ['webpub-membership', 'webpub-membership', '/membership'],
    ['webpub-contact', 'webpub-contact', '/contact'],
  ];
  for (const [id, name, route] of longPages) {
    await scrollPair(mob, desk, manifest, errors, id, name, `${BASE}${route}`);
  }

  await scrollPair(mob, desk, manifest, errors, 'webpub-events', 'webpub-events', `${BASE}/events`);
  if (eventId) {
    await scrollPair(mob, desk, manifest, errors, 'webpub-event-detail', 'webpub-event-detail', `${BASE}/events/${eventId}`);
  }

  await scrollPair(mob, desk, manifest, errors, 'webpub-news', 'webpub-news', `${BASE}/news`);
  await scrollPair(mob, desk, manifest, errors, 'webpub-news-detail', 'webpub-news-detail', `${BASE}/news/${newsSlug}`);

  if (newsletterSlug) {
    await scrollPair(mob, desk, manifest, errors, 'webpub-newsletter', 'webpub-newsletter', `${BASE}/newsletter`);
    await scrollPair(
      mob,
      desk,
      manifest,
      errors,
      'webpub-newsletter-detail',
      'webpub-newsletter-detail',
      `${BASE}/newsletter/${newsletterSlug}`,
    );
  }

  await scrollPair(mob, desk, manifest, errors, 'webpub-gallery', 'webpub-gallery', `${BASE}/gallery`);
  if (albumId) {
    await scrollPair(mob, desk, manifest, errors, 'webpub-gallery-album', 'webpub-gallery-album', `${BASE}/gallery/${albumId}`);
  }

  await scrollPair(mob, desk, manifest, errors, 'webpub-apply', 'webpub-apply', `${BASE}/membership/apply`);

  for (const [id, file, route, markers] of [
    ['webpub-login-m', 'webpub-login-m.png', '/login', [{ role: 'button', name: /Sign in/i, label: 'Sign-in button' }]],
    ['webpub-signup-m', 'webpub-signup-m.png', '/signup', []],
    ['webpub-forgot-m', 'webpub-forgot-m.png', '/forgot-password', []],
  ]) {
    await captureOne(mob, manifest, errors, id, file, () => mob.goto(`${BASE}${route}`), { markers, expectPath: route });
  }

  for (const [id, file, route] of [
    ['webpub-login-d', 'webpub-login-d.png', '/login'],
    ['webpub-signup-d', 'webpub-signup-d.png', '/signup'],
  ]) {
    await captureOne(desk, manifest, errors, id, file, () => desk.goto(`${BASE}${route}`), { expectPath: route });
  }

  await captureOne(mob, manifest, errors, 'webpub-offline-m', 'webpub-offline-m.png', () => mob.goto(`${BASE}/offline`), {
    expectPath: '/offline',
  });

  await mobileCtx.close();
  await deskCtx.close();

  const adminState = path.join(AUTH_DIR, 'admin.json');
  if (!fs.existsSync(adminState)) {
    errors.push({ id: 'edit-admin', msg: 'Missing admin auth — run committee-presentation-auth.mjs' });
    return errors;
  }

  console.log('Website expansion — editing guide…');
  spawnSync('node', ['scripts/committee-presentation-auth.mjs'], { cwd: root, stdio: 'inherit' });
  const deskAdmin = await browser.newContext({ ...DESKTOP, storageState: adminState });
  const admin = await deskAdmin.newPage();

  await captureOne(admin, manifest, errors, 'edit-inline-about', 'edit-inline-about.png', async () => {
    await admin.goto(`${BASE}/about`);
    await admin.waitForTimeout(1500);
  }, {
    markers: [{ sel: '.inline-edit-toolbar, .inline-edit-toolbar-label', label: 'Edit mode toolbar (admins only)' }],
    expectPath: '/about',
  });

  await captureOne(admin, manifest, errors, 'edit-texts-hero', 'edit-texts-hero.png', async () => {
    await admin.goto(`${BASE}/admin/texts`);
    await admin.waitForTimeout(800);
    await admin.getByPlaceholder(/Search words/i).fill('Welcome to OLSC');
    await admin.waitForTimeout(600);
  }, {
    markers: [{ sel: 'table, [class*="TextRow"]', label: 'Editable text rows' }],
    expectPath: '/admin/texts',
  });

  await captureOne(admin, manifest, errors, 'edit-texts-ar', 'edit-texts-arabic.png', async () => {
    await admin.goto(`${BASE}/admin/texts`);
    await admin.waitForTimeout(500);
    const lang = admin.getByTestId('language-switcher').locator('select');
    if (await lang.count()) await lang.selectOption('ar');
    else await admin.locator('select').first().selectOption('ar').catch(() => {});
    await admin.waitForTimeout(800);
  }, { expectPath: '/admin/texts' });

  await captureOne(admin, manifest, errors, 'edit-cms-membership', 'edit-cms-membership.png', () =>
    admin.goto(`${BASE}/admin/cms`),
  );

  await captureOne(admin, manifest, errors, 'edit-settings', 'edit-settings-branding.png', async () => {
    await admin.goto(`${BASE}/admin/settings`);
    await admin.getByRole('button', { name: /^Branding$/i }).click();
    await admin.waitForTimeout(600);
  }, {
    markers: [{ role: 'button', name: /Choose image/i, label: 'Upload logo or icon' }],
    expectPath: '/admin/settings',
  });

  await captureOne(admin, manifest, errors, 'edit-settings-features', 'edit-settings-features.png', async () => {
    await admin.goto(`${BASE}/admin/settings`);
    await admin.getByRole('button', { name: /^Features$/i }).click();
    await admin.waitForTimeout(600);
  }, {
    markers: [{ sel: '[role="switch"]', label: 'On/off switches (not typing true/false)' }],
    expectPath: '/admin/settings',
  });

  await captureOne(admin, manifest, errors, 'admin-settings', 'admin-settings.png', async () => {
    await admin.goto(`${BASE}/admin/settings`);
    await admin.getByRole('button', { name: /^Features$/i }).click();
    await admin.waitForTimeout(400);
  }, { expectPath: '/admin/settings' });

  await captureOne(admin, manifest, errors, 'edit-design', 'edit-design-branding.png', () =>
    admin.goto(`${BASE}/admin/design`),
  );

  await captureOne(admin, manifest, errors, 'edit-news-draft', 'edit-news-publish.png', async () => {
    await admin.goto(`${BASE}/admin/news`);
    await admin.waitForTimeout(1000);
  }, {
    markers: [{ role: 'button', name: /new|create|add/i, label: 'Create or edit a news story' }],
  });

  await captureOne(admin, manifest, errors, 'edit-newsletter-schedule', 'edit-newsletter-schedule.png', () =>
    admin.goto(`${BASE}/admin/newsletter`),
  );

  await captureOne(admin, manifest, errors, 'edit-audit-content', 'edit-audit-trail.png', () =>
    admin.goto(`${BASE}/admin/audit`),
  );

  await captureOne(
    admin,
    manifest,
    errors,
    'edit-home-after-hero',
    'edit-home-hero-preview.png',
    async () => {
      await admin.goto(`${BASE}/`);
      await admin.waitForTimeout(1200);
    },
    {
      markers: [{ role: 'heading', name: /Welcome to OLSC/i, label: 'Hero title visitors see after you save in Texts' }],
    },
  );

  await deskAdmin.close();
  return errors;
}

async function main() {
  const manifest = fs.existsSync(MANIFEST_PATH)
    ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
    : { shots: {}, errors: [] };
  const errors = [...(manifest.errors ?? [])];

  const health = await fetch(`${API}/api/health`).catch(() => null);
  if (!health?.ok) throw new Error('API not running on :3000');

  const browser = await chromium.launch();
  const expansionErrors = await captureWebsiteExpansion(browser, manifest, errors);
  await browser.close();

  manifest.errors = expansionErrors.filter((e) => e.msg && !manifest.shots[e.id]?.file);
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  const failed = expansionErrors.filter((e) => e.msg || e.file);
  if (failed.length) {
    console.error(`Expansion capture finished with ${failed.length} error(s)`);
    process.exitCode = 1;
  } else {
    console.log(`Expansion shots in manifest: ${Object.keys(manifest.shots).length}`);
  }
}

const isCli =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href.replace(/\\/g, '/') ===
    import.meta.url.replace(/\\/g, '/');
if (isCli) {
  main();
}