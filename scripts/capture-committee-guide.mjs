#!/usr/bin/env node
/**
 * Committee guide captures with auth storage + marker metadata.
 * Prereqs: API + web running, seed, committee-presentation-auth.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from '@playwright/test';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(root, 'docs/committee-presentation/shots');
const AUTH_DIR = path.join(root, 'docs/committee-presentation/.auth');
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

const MOBILE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent: devices['Pixel 5'].userAgent,
};
const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };

const manifest = { shots: {}, errors: [] };

async function stabilize(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(500);
  await page.locator('.animate-pulse').first().waitFor({ state: 'hidden', timeout: 12_000 }).catch(() => {});
}

async function assertNotLogin(page, label) {
  const url = page.url();
  if (url.includes('/login')) {
    throw new Error(`${label}: still on login URL`);
  }
  const signIn = page.getByRole('heading', { name: /Sign in to RedLeb Hub/i });
  if (await signIn.isVisible().catch(() => false)) {
    throw new Error(`${label}: login heading visible`);
  }
}

async function collectMarkers(page, defs) {
  const vp = page.viewportSize();
  if (!vp) return [];
  const markers = [];
  for (let i = 0; i < defs.length; i += 1) {
    const d = defs[i];
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

async function capture(page, id, file, action, { markers = [], fullPage = false, expectPath = null } = {}) {
  try {
    await action();
    await stabilize(page);
    await assertNotLogin(page, id);
    if (expectPath && !page.url().includes(expectPath)) {
      throw new Error(`${id}: expected URL containing ${expectPath}, got ${page.url()}`);
    }
    const markerData = markers.length ? await collectMarkers(page, markers) : [];
    const out = path.join(OUT_DIR, file);
    await page.screenshot({ path: out, fullPage: !!fullPage });
    const bad =
      (await page.getByText(/Something went wrong/i).isVisible().catch(() => false)) ||
      (await page.getByText(/Failed to load/i).isVisible().catch(() => false));
    if (bad) throw new Error(`${id}: error message on screen`);
    manifest.shots[id] = { file, markers: markerData, url: page.url() };
    console.log(`  ✓ ${file}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    manifest.errors.push({ id, file, msg });
    console.error(`  ✗ ${file}: ${msg}`);
  }
}

async function scrollCapture(page, id, baseName, action, markers) {
  await action();
  await stabilize(page);
  await assertNotLogin(page, id);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  const markerData = await collectMarkers(page, markers);
  await page.screenshot({ path: path.join(OUT_DIR, `${baseName}-top.png`) });
  manifest.shots[`${id}-top`] = { file: `${baseName}-top.png`, markers: markerData, url: page.url() };
  console.log(`  ✓ ${baseName}-top.png`);
  await page.evaluate(() => window.scrollTo(0, 440));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, `${baseName}-mid.png`) });
  manifest.shots[`${id}-mid`] = { file: `${baseName}-mid.png`, markers: [], url: page.url() };
  console.log(`  ✓ ${baseName}-mid.png`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const adminState = path.join(AUTH_DIR, 'admin.json');
  const memberState = path.join(AUTH_DIR, 'member.json');
  if (!fs.existsSync(adminState) || !fs.existsSync(memberState)) {
    throw new Error('Run: node scripts/committee-presentation-auth.mjs first');
  }

  const browser = await chromium.launch();
  const health = await fetch(`${BASE.replace('5173', '3000')}/api/health`).catch(() => null);
  if (!health?.ok) throw new Error('API not running on :3000');

  const publicCtx = await browser.newContext(MOBILE);
  const pub = await publicCtx.newPage();
  console.log('Public (mobile)…');
  await scrollCapture(pub, 'pub-home', 'pub-home', () => pub.goto(`${BASE}/`), []);
  await capture(pub, 'pub-gallery', 'pub-gallery.png', () => pub.goto(`${BASE}/gallery`));
  const galRes = await pub.request.get(`${BASE.replace('5173', '3000')}/api/gallery`);
  let albumId = '';
  if (galRes.ok()) {
    const albums = await galRes.json();
    const list = Array.isArray(albums) ? albums : [];
    albumId = list.find((a) => a.title?.includes('Demo Kop'))?.id ?? list[0]?.id ?? '';
  }
  if (albumId) {
    await capture(pub, 'pub-gallery-album', 'pub-gallery-album.png', () =>
      pub.goto(`${BASE}/gallery/${albumId}`),
    );
  }
  await capture(pub, 'pub-apply-validation', 'pub-apply-validation.png', async () => {
    await pub.goto(`${BASE}/membership/apply`);
    await pub.getByRole('button', { name: /Submit application/i }).click();
    await pub.waitForTimeout(600);
  });
  await capture(pub, 'pub-lang-ar', 'pub-language-ar.png', async () => {
    await pub.goto(`${BASE}/`);
    const lang = pub.getByTestId('language-switcher');
    if (await lang.isVisible().catch(() => false)) {
      await lang.selectOption('ar');
    } else {
      await pub.locator('select').first().selectOption('ar').catch(() => {});
    }
    await pub.waitForTimeout(800);
  });
  await publicCtx.close();

  const memberCtx = await browser.newContext({ ...MOBILE, storageState: memberState });
  const member = await memberCtx.newPage();

  console.log('Member app (mobile)…');
  await scrollCapture(
    member,
    'mem-home',
    'mem-home',
    () => member.goto(`${BASE}/app`),
    [{ role: 'link', name: /card|membership/i, label: 'Open your digital card' }],
  );
  await capture(member, 'mem-card', 'mem-card.png', () => member.goto(`${BASE}/app/membership-card`), {
    markers: [{ sel: 'canvas, img[alt*="QR"]', label: 'QR code for check-in' }],
    expectPath: '/membership-card',
  });
  await capture(member, 'mem-matches', 'mem-matches.png', () => member.goto(`${BASE}/app/matches`), {
    expectPath: '/matches',
  });
  const hub = await member.request.get(`${BASE.replace('5173', '3000')}/api/matches`).catch(() => null);
  let matchId = '';
  if (hub?.ok()) {
    const data = await hub.json();
    const list = Array.isArray(data) ? data : [];
    matchId = list[0]?.id ?? '';
  }
  if (matchId) {
    await capture(member, 'mem-match-hub', 'mem-match-hub.png', () => member.goto(`${BASE}/app/matches/${matchId}`), {
      markers: [{ role: 'button', name: /submit|save|predict/i, label: 'Send your prediction' }],
    });
  }
  await capture(member, 'mem-leaderboard', 'mem-leaderboard.png', () => member.goto(`${BASE}/app/leaderboard`));
  await capture(member, 'mem-community', 'mem-community.png', () => member.goto(`${BASE}/app/community`));
  await capture(member, 'mem-news-detail', 'mem-news-detail.png', () => member.goto(`${BASE}/news/demo-kop-win`), {
    markers: [{ sel: '.comment-thread, [class*="comment"]', label: 'Comments from members' }],
    expectPath: '/news/',
  });
  await capture(member, 'mem-notifications', 'mem-notifications.png', () => member.goto(`${BASE}/app/notifications`));
  await capture(member, 'mem-profile', 'mem-profile.png', () => member.goto(`${BASE}/app/profile`), {
    markers: [{ sel: 'input, label', label: 'Your details and ALLRED SUPPORT ID' }],
  });
  await capture(member, 'mem-hof', 'mem-hall-of-fame.png', () => member.goto(`${BASE}/app/hall-of-fame`));
  await capture(member, 'mem-events-list', 'mem-events-list.png', () => member.goto(`${BASE}/events`));
  const evRes = await member.request.get(`${BASE.replace('5173', '3000')}/api/events`);
  let eventId = '';
  if (evRes.ok()) {
    const events = await evRes.json();
    eventId = events.find((e) => e.title?.includes('Committee Demo'))?.id ?? events[0]?.id ?? '';
  }
  if (eventId) {
    await capture(member, 'mem-event-detail', 'mem-event-detail.png', async () => {
      await member.goto(`${BASE}/events/${eventId}`);
      const sel = member.locator('main select, form select').last();
      if (await sel.isVisible().catch(() => false)) await sel.selectOption('1').catch(() => {});
    });
  }
  await memberCtx.close();

  const desktop = await browser.newContext({ ...DESKTOP, storageState: adminState });
  const admin = await desktop.newPage();
  console.log('Admin (desktop)…');

  const adminRoutes = [
    ['admin-dashboard', '/admin', [{ role: 'heading', name: /dashboard|admin|quick/i, label: 'Your starting point' }]],
    ['admin-applications', '/admin/applications', []],
    ['admin-members', '/admin/members', [{ sel: 'input[placeholder*="Search"]', label: 'Find a member quickly' }]],
    ['admin-events', '/admin/events', []],
    ['admin-matches', '/admin/matches', []],
    ['admin-news', '/admin/news', []],
    ['admin-newsletter', '/admin/newsletter', []],
    ['admin-cms', '/admin/cms', []],
    ['admin-texts', '/admin/texts', []],
    ['admin-settings', '/admin/settings', []],
    ['admin-design', '/admin/design', []],
    ['admin-moderation', '/admin/moderation', []],
    ['admin-audit', '/admin/audit', []],
    ['admin-checkin', '/admin/check-in', []],
  ];

  for (const [id, route, markers] of adminRoutes) {
    await capture(
      admin,
      id,
      `${id}.png`,
      async () => {
        await admin.goto(`${BASE}${route}`);
        if (id === 'admin-members') {
          await admin.locator('input[placeholder*="Search"]').first().fill('example.local');
          await admin.waitForTimeout(600);
        }
      },
      { markers, expectPath: route },
    );
  }

  await capture(admin, 'admin-confirm-dialog', 'admin-confirm-dialog.png', async () => {
    await admin.goto(`${BASE}/admin/applications`);
    await admin.waitForTimeout(1000);
    await admin.getByRole('button', { name: /Casey Demo/i }).first().click();
    await admin.getByText('Delete application').first().click();
    await admin.getByRole('heading', { name: /Delete application/i }).waitFor({ timeout: 10_000 });
  });

  await capture(
    admin,
    'admin-member-edit',
    'admin-member-activity.png',
    async () => {
      await admin.goto(`${BASE}/admin/members`);
      await admin.locator('input[placeholder*="Search"]').first().fill('Jamie');
      await admin.waitForTimeout(500);
      await admin.getByRole('button', { name: /^Edit$/i }).first().click();
    },
    { expectPath: '/admin/members' },
  );

  await capture(
    admin,
    'admin-about-edit',
    'admin-inline-edit-desktop.png',
    async () => {
      await admin.goto(`${BASE}/about`);
      await admin.waitForTimeout(2000);
    },
    { expectPath: '/about' },
  );

  const mobileAdminCtx = await browser.newContext({ ...MOBILE, storageState: adminState });
  const mobileAdmin = await mobileAdminCtx.newPage();
  await capture(mobileAdmin, 'admin-texts-mobile', 'admin-texts-mobile.png', () =>
    mobileAdmin.goto(`${BASE}/admin/texts`),
  );

  await browser.close();

  if (manifest.errors.length) {
    fs.writeFileSync(path.join(root, 'docs/committee-presentation/shots-manifest.json'), JSON.stringify(manifest, null, 2));
    throw new Error(`Capture failures: ${manifest.errors.length}`);
  }
  fs.writeFileSync(path.join(root, 'docs/committee-presentation/shots-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Done: ${Object.keys(manifest.shots).length} shots`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});