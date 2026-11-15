#!/usr/bin/env node
/**
 * Capture committee presentation screenshots (Playwright).
 * Prereqs: API + web running; demo seed + seed-committee-demo.mjs
 *
 *   PLAYWRIGHT_SKIP_WEBSERVER=1 node scripts/capture-committee-shots.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const OUT_DIR = path.join(root, 'docs/committee-presentation/shots');
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

const ADMIN_USER = process.env.E2E_ADMIN_USERNAME ?? 'admin';
const ADMIN_PASS =
  process.env.E2E_ADMIN_PASSWORD ?? process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'ChangeMeNow123!';
const MEMBER_USER = process.env.E2E_MEMBER_USERNAME ?? 'e2e.member';
const MEMBER_PASS = process.env.E2E_MEMBER_PASSWORD ?? 'E2eMember123!';

const MOBILE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent: devices['Pixel 5'].userAgent,
};

const DESKTOP = {
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
};

/** @type {{ file: string; fail?: string }[]} */
const manifest = { captured: [], missing: [] };

async function stabilize(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0.001ms !important;
        animation-delay: 0.001ms !important;
        transition-duration: 0.001ms !important;
      }
      .inline-edit-toolbar { opacity: 1 !important; }
    `,
  });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(400);
  await page.locator('.animate-pulse').first().waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
}

async function hideChrome(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[class*="install"]').forEach((el) => {
      if (el instanceof HTMLElement) el.style.display = 'none';
    });
  });
}

async function login(page, username, password) {
  await page.goto(`${BASE}/login`);
  await page.getByPlaceholder('e.g. test').fill(username);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /^Sign in$/i }).click();
  await page.waitForURL(/\/(app|admin)/, { timeout: 45_000 });
}

async function shot(page, file, run, { fullPage = false } = {}) {
  const out = path.join(OUT_DIR, file);
  try {
    await run();
    await stabilize(page);
    await hideChrome(page);
    await page.screenshot({ path: out, fullPage });
    manifest.captured.push(file);
    console.log(`  ✓ ${file}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    manifest.missing.push({ file, reason: msg });
    console.warn(`  ✗ ${file}: ${msg}`);
  }
}

async function resolveDemoIds(page, token) {
  const api = BASE.replace('5173', '3000') + '/api';
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  let eventId = '';
  let matchId = '';
  let albumId = '';

  const eventsRes = await page.request.get(`${api}/events`, { headers }).catch(() => null);
  if (eventsRes?.ok()) {
    const events = await eventsRes.json();
    const list = Array.isArray(events) ? events : events.items ?? [];
    const demo = list.find((e) => e.title?.includes('Committee Demo')) ?? list[0];
    if (demo?.id) eventId = demo.id;
  }
  const matchesRes = await page.request.get(`${api}/matches`, { headers }).catch(() => null);
  if (matchesRes?.ok()) {
    const matches = await matchesRes.json();
    const list = Array.isArray(matches) ? matches : matches.items ?? [];
    const demo = list.find((m) => m.opponent?.includes('Nottingham')) ?? list[0];
    if (demo?.id) matchId = demo.id;
  }
  const albumsRes = await page.request.get(`${api}/gallery`, { headers }).catch(() => null);
  if (albumsRes?.ok()) {
    const albums = await albumsRes.json();
    const list = Array.isArray(albums) ? albums : albums.items ?? [];
    const demo = list.find((a) => a.title?.includes('Demo Kop')) ?? list[0];
    if (demo?.id) albumId = demo.id;
  }
  return { eventId, matchId, albumId };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const health = await fetch(`${BASE.replace('5173', '3000')}/api/health`).catch(() => null);
  if (!health?.ok) {
    console.error('API not reachable at :3000 — start API before capture.');
    process.exit(1);
  }

  if (process.env.COMMITTEE_SKIP_PUBLIC === '1') {
    console.log('Skipping public/mobile (COMMITTEE_SKIP_PUBLIC=1)…');
  }

  const mobileCtx = await browser.newContext(MOBILE);
  const mobile = await mobileCtx.newPage();

  if (process.env.COMMITTEE_SKIP_PUBLIC === '1') {
    await mobileCtx.close();
  } else {
  console.log('Public (mobile)…');
  await shot(mobile, '01-home-mobile-top.png', async () => {
    await mobile.goto(`${BASE}/`);
    await mobile.evaluate(() => window.scrollTo(0, 0));
  });

  await shot(
    mobile,
    '02-home-mobile-scrolled.png',
    async () => {
      await mobile.goto(`${BASE}/`);
      await mobile.evaluate(() => window.scrollTo(0, 560));
    },
    { fullPage: true },
  );

  const publicRoutes = [
    ['03-about.png', '/about'],
    ['04-committee.png', '/committee'],
    ['05-events-list.png', '/events'],
    ['07-news-list.png', '/news'],
    ['09-newsletter.png', '/newsletter'],
    ['10-gallery.png', '/gallery'],
    ['11-membership.png', '/membership'],
    ['12-membership-apply.png', '/membership/apply'],
    ['13-login.png', '/login'],
  ];
  for (const [file, route] of publicRoutes) {
    await shot(mobile, file, async () => mobile.goto(`${BASE}${route}`));
  }

  await shot(mobile, '08-news-detail.png', async () => mobile.goto(`${BASE}/news/e2e-demo-news`));

  await login(mobile, MEMBER_USER, MEMBER_PASS);
  const memberToken = await mobile.evaluate(() => localStorage.getItem('kop_access_token') ?? '');

  const { eventId, matchId, albumId } = await resolveDemoIds(mobile, memberToken);

  await shot(mobile, '06-event-detail-guests.png', async () => {
    await mobile.goto(`${BASE}/events/${eventId}`);
    const guestSelect = mobile.locator('select').filter({ hasText: /guest/i }).first();
    if (await guestSelect.isVisible().catch(() => false)) {
      await guestSelect.selectOption('2');
    } else {
      const fallback = mobile.locator('main select, form select').last();
      if (await fallback.isVisible().catch(() => false)) {
        await fallback.selectOption('2').catch(() => fallback.selectOption({ index: 2 }));
      }
    }
    await mobile.getByLabel(/guest names/i).fill('Guest One, Guest Two').catch(() => {});
  });

  if (albumId) {
    await shot(mobile, '10-gallery-album.png', async () => mobile.goto(`${BASE}/gallery/${albumId}`));
  }

  const memberRoutes = [
    ['14-member-home.png', '/app'],
    ['15-membership-card.png', '/app/membership-card'],
    ['16-matches-list.png', '/app/matches'],
    ['18-leaderboard.png', '/app/leaderboard'],
    ['19-community.png', '/app/community'],
    ['20-notifications.png', '/app/notifications'],
    ['21-profile.png', '/app/profile'],
    ['22-hall-of-fame.png', '/app/hall-of-fame'],
  ];
  for (const [file, route] of memberRoutes) {
    await shot(mobile, file, async () => mobile.goto(`${BASE}${route}`));
  }

  if (matchId) {
    await shot(mobile, '17-match-hub.png', async () => mobile.goto(`${BASE}/app/matches/${matchId}`));
  }

  await mobileCtx.close();
  }

  const desktopCtx = await browser.newContext(DESKTOP);
  const desktop = await desktopCtx.newPage();
  await login(desktop, ADMIN_USER, ADMIN_PASS);

  async function ensureAdmin(page) {
    if (!page.url().includes('/admin')) {
      await login(page, ADMIN_USER, ADMIN_PASS);
    }
  }

  async function goAdminMembers(page) {
    await login(page, ADMIN_USER, ADMIN_PASS);
    await page.goto(`${BASE}/admin/members`, { waitUntil: 'load', timeout: 90_000 });
    await page.waitForTimeout(2500);
  }

  async function filterDemoOnlyMembers(page) {
    await goAdminMembers(page);
    const search = page.locator('input[placeholder*="Search"], input.kop-input').first();
    await search.fill('e2e.member');
    await page.waitForTimeout(800);
  }

  const adminRoutes = [
    ['25-admin-members.png', '/admin/members'],
    ['26-admin-member-activity.png', '__activity__'],
    ['23-admin-dashboard.png', '/admin'],
    ['24-admin-applications.png', '/admin/applications'],
    ['27-admin-events.png', '/admin/events'],
    ['28-admin-matches.png', '/admin/matches'],
    ['29-admin-news.png', '/admin/news'],
    ['30-admin-newsletter.png', '/admin/newsletter'],
    ['31-admin-cms.png', '/admin/cms'],
    ['33-admin-texts.png', '/admin/texts'],
    ['34-admin-settings.png', '/admin/settings'],
    ['35-admin-design.png', '/admin/design'],
  ];
  console.log('Admin (desktop)…');
  await ensureAdmin(desktop);
  for (const [file, route] of adminRoutes) {
    if (file === '25-admin-members.png') {
      await shot(desktop, file, async () => filterDemoOnlyMembers(desktop));
    } else if (file === '26-admin-member-activity.png') {
      await shot(desktop, file, async () => {
        await filterDemoOnlyMembers(desktop);
        const card = desktop.locator('article, table tbody tr').filter({ hasText: /Jamie|e2e\.member/i }).first();
        await card.getByRole('button', { name: /^Edit$/i }).click({ timeout: 20_000 });
        await desktop.getByText(/last seen|login count|activity/i).first().waitFor({ timeout: 15_000 });
      });
    } else {
      await shot(desktop, file, async () => {
        await login(desktop, ADMIN_USER, ADMIN_PASS);
        await desktop.goto(`${BASE}${route}`);
      });
    }
  }

  await shot(desktop, '31b-admin-cms-about-preview.png', async () => {
    await desktop.goto(`${BASE}/admin/cms`);
    await desktop.waitForTimeout(3000);
  });

  const mobileAdminCtx = await browser.newContext(MOBILE);
  const mobileAdmin = await mobileAdminCtx.newPage();
  await shot(mobileAdmin, '32-admin-inline-edit-mobile.png', async () => {
    await login(mobileAdmin, ADMIN_USER, ADMIN_PASS);
    await mobileAdmin.goto(`${BASE}/admin/texts`);
    await mobileAdmin.waitForTimeout(3000);
  });
  await mobileAdminCtx.close();

  await desktopCtx.close();
  await browser.close();

  fs.writeFileSync(
    path.join(root, 'docs/committee-presentation/capture-manifest.json'),
    JSON.stringify(manifest, null, 2),
  );
  console.log(`\nDone. ${manifest.captured.length} shots, ${manifest.missing.length} missing.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});