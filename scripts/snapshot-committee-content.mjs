#!/usr/bin/env node
/**
 * Live EN/AR content + CMS sections for committee PDF (requires API on :3000).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'docs/committee-presentation/content-snapshot.json');
const api = process.env.COMMITTEE_API_URL ?? 'http://localhost:3000/api';

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

function loadRegistryDefaults() {
  const src = fs.readFileSync(path.join(root, 'packages/shared/src/content-registry.ts'), 'utf8');
  const entries = [];
  const blocks = src.split(/\{\s*\n\s*key:\s*'/);
  for (const chunk of blocks.slice(1)) {
    const key = chunk.split("'")[0];
    const areaM = chunk.match(/area:\s*'([^']+)'/);
    const descM = chunk.match(/description:\s*'((?:\\'|[^'])*)'/);
    let defaultEn = '';
    const inline = chunk.match(/defaultEn:\s*'((?:\\'|[^'])*)'/);
    const multi = chunk.match(/defaultEn:\s*\n\s*'((?:\\'|[^'])*)'/);
    const tick = chunk.match(/defaultEn:\s*\n\s*`([^`]+)`/);
    if (inline) defaultEn = inline[1].replace(/\\'/g, "'");
    else if (multi) defaultEn = multi[1].replace(/\\'/g, "'");
    else if (tick) defaultEn = tick[1];
    if (!key || !areaM) continue;
    entries.push({
      key,
      defaultEn,
      area: areaM[1],
      description: (descM?.[1] ?? key).replace(/\\'/g, "'"),
    });
  }
  return entries;
}

function loadArPartial() {
  const src = fs.readFileSync(path.join(root, 'packages/shared/src/content-registry-ar.ts'), 'utf8');
  const map = {};
  const re = /'([^']+)':\s*'((?:\\'|[^'])*)'|'([^']+)':\s*\n\s*'((?:\\'|[^'])*)'/g;
  let m;
  while ((m = re.exec(src))) {
    const key = m[1] ?? m[3];
    const val = (m[2] ?? m[4] ?? '').replace(/\\'/g, "'");
    if (key) map[key] = val;
  }
  return map;
}

function readableLabel(entry) {
  const area = entry.area.replace(/ navigation$/i, '').trim();
  return `${area} – ${entry.description}`;
}

function pageForKey(key) {
  if (key.startsWith('home.')) return 'Home';
  if (key.startsWith('nav.public') || key.startsWith('footer.') || key.startsWith('public.header'))
    return 'All public pages (header/footer)';
  if (key.startsWith('about.')) return 'About';
  if (key.startsWith('committee.')) return 'Committee';
  if (key.startsWith('membership.')) return 'Membership';
  if (key.startsWith('contact.')) return 'Contact';
  if (key.startsWith('auth.')) return 'Login / Sign up';
  if (key.startsWith('events.public')) return 'Events';
  if (key.startsWith('news.public')) return 'News';
  if (key.startsWith('gallery.public')) return 'Gallery';
  if (key.startsWith('newsletter.public')) return 'Newsletter';
  return 'Various';
}

function editWhere(key, area) {
  if (area === 'Branding' || key.startsWith('brand.'))
    return 'Admin → Settings & branding (and sometimes Design)';
  if (key.startsWith('home.') || key.startsWith('nav.') || key.startsWith('footer.') || key.startsWith('auth.'))
    return 'Admin → Texts & labels (search the label you see on screen)';
  if (key.startsWith('about.') || key.startsWith('committee.') || key.startsWith('membership.') || key.startsWith('contact.'))
    return 'Admin → Pages (CMS), or inline edit on the live page while signed in as admin';
  return 'Admin → Texts & labels';
}

async function main() {
  const registry = loadRegistryDefaults();
  const arPartial = loadArPartial();
  const [enBundle, arBundle] = await Promise.all([
    getJson(`${api}/content/bundle?lang=en`),
    getJson(`${api}/content/bundle?lang=ar`),
  ]);
  const en = enBundle?.values ?? enBundle ?? {};
  const ar = arBundle?.values ?? arBundle ?? {};

  const cmsCodes = ['ABOUT', 'COMMITTEE', 'MEMBERSHIP', 'CONTACT'];
  const cms = {};
  for (const code of cmsCodes) {
    cms[code] = await getJson(`${api}/cms/pages/${code}`).catch(() => null);
  }

  const [newsList, events, newsletters, albums] = await Promise.all([
    getJson(`${api}/news?limit=5`).catch(() => []),
    getJson(`${api}/events`).catch(() => []),
    getJson(`${api}/newsletters`).catch(() => []),
    getJson(`${api}/gallery`).catch(() => []),
  ]);

  const inventory = registry
    .filter((e) => !e.area.startsWith('Admin') && e.area !== 'Member navigation')
    .map((e) => ({
      label: readableLabel(e),
      currentEn: en[e.key] ?? e.defaultEn,
      currentAr: ar[e.key] ?? arPartial[e.key] ?? '(not set yet — import Arabic preset or type in Texts & labels)',
      appearsOn: pageForKey(e.key),
      editIn: editWhere(e.key, e.area),
      who: 'Super Admin, Committee Admin, or Content Manager (Texts/CMS); branding also needs Settings access',
    }));

  const snap = {
    generatedAt: new Date().toISOString(),
    en,
    ar,
    cms,
    demo: {
      newsSlug: (Array.isArray(newsList) ? newsList[0] : newsList?.items?.[0])?.slug ?? 'demo-kop-win',
      eventId:
        (Array.isArray(events) ? events : []).find((e) => e.title?.includes('Committee Demo'))?.id ??
        (Array.isArray(events) ? events[0]?.id : null),
      newsletterSlug: (Array.isArray(newsletters) ? newsletters[0] : null)?.slug ?? null,
      albumId:
        (Array.isArray(albums) ? albums : []).find((a) => a.title?.includes('Demo Kop'))?.id ??
        (Array.isArray(albums) ? albums[0]?.id : null),
    },
    inventory,
  };

  fs.writeFileSync(out, JSON.stringify(snap, null, 2));
  console.log(`Wrote ${out} (${inventory.length} inventory rows, demo slugs OK)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});