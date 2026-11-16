#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAP_PATH = path.join(root, 'docs/committee-presentation/content-snapshot.json');

function loadSnap() {
  if (fs.existsSync(SNAP_PATH)) return JSON.parse(fs.readFileSync(SNAP_PATH, 'utf8'));
  return { en: {}, ar: {}, cms: {}, inventory: [], demo: {} };
}

function q(snap, key, fallback = '') {
  const v = snap.en?.[key];
  if (v && String(v).trim()) return String(v).trim();
  return fallback;
}

function quote(text) {
  return `“${String(text).replace(/"/g, '&quot;')}”`;
}

function dualShots(ctx, mTop, dTop, mMid, dMid) {
  const mf = ctx.shotFile(mTop, `${mTop}.png`);
  const df = ctx.shotFile(dTop, `${dTop}.png`);
  const mm = mMid ? ctx.shotFile(mMid, `${mMid}.png`) : null;
  const dm = dMid ? ctx.shotFile(dMid, `${dMid}.png`) : null;
  const mMarkers = ctx.manifest.shots[mTop]?.markers ?? [];
  const dMarkers = ctx.manifest.shots[dTop]?.markers ?? [];
  let html = '<div class="dual-device">';
  if (mTop) {
    html += `<div><p class="device-label">Phone</p>${ctx.annotated(mf, mMarkers)}</div>`;
    if (mm) html += `<div class="phone-secondary">${ctx.annotated(mm, [])}</div>`;
  }
  if (dTop) {
    html += `<div><p class="device-label">Computer</p>${ctx.annotated(df, dMarkers)}</div>`;
    if (dm) html += `<div class="desk-secondary">${ctx.annotated(dm, [])}</div>`;
  }
  html += '</div>';
  return html;
}

function sheet(ctx, slug, title, body, klass = 'website-sheet guide-sheet') {
  const id = ctx.nextId(slug);
  return `<section class="sheet ${klass}" id="${id}">
  <h2>${title}</h2>
  ${body}
  <div class="footer">RedLeb Hub – OLSC Lebanon · ${title}</div>
</section>`;
}

function blockList(items) {
  return `<ul class="block-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
}

function cmsSummary(snap, code) {
  const page = snap.cms?.[code];
  if (!page?.sections?.length) return '<p class="note">Structured sections from the CMS (demo content).</p>';
  const bits = page.sections.slice(0, 6).map((s) => {
    const title = s.title || s.heading || s.type;
    const raw = s.body ?? s.text ?? s.content ?? '';
    const body = String(raw).replace(/<[^>]+>/g, ' ').slice(0, 120);
    return `<strong>${title || s.type}</strong>${body ? ` — ${body.trim()}…` : ''}`;
  });
  return blockList(bits);
}

function publicPage(ctx, snap, cfg) {
  const written = cfg.written(snap);
  const sources = cfg.sources(snap);
  const how = cfg.howTo;
  const body = `
  ${dualShots(ctx, cfg.shots.mTop, cfg.shots.dTop, cfg.shots.mMid, cfg.shots.dMid)}
  <div class="web-copy-cols">
    <h3>What&rsquo;s written here</h3>
    ${written}
    <h3>Where the content comes from</h3>
    ${sources}
    <h3>How to change it</h3>
    <ol class="steps">${how.map((h) => `<li>${h}</li>`).join('')}</ol>
  </div>`;
  return sheet(ctx, cfg.slug, cfg.title, body);
}

/**
 * @param {object} ctx — { nextId, shotFile, annotated, manifest, tip, headsUp }
 */
export function buildWebsiteExpansion(ctx) {
  const snap = loadSnap();
  const sections = [];

  sections.push(
    sheet(
      ctx,
      'web-exp-intro',
      'The Public Website, page by page',
      `<p>This section walks through every public page exactly as visitors see it in this demo pack. Wording below is taken from the live demo site — fictional names only.</p>
      ${ctx.headsUp('Long pages include a second screenshot further down the scroll.')}`,
      'website-sheet guide-sheet',
    ),
  );

  const pages = [
    {
      slug: 'web-page-home',
      title: 'Public page — Home',
      shots: { mTop: 'webpub-home-m-top', dTop: 'webpub-home-d-top', mMid: 'webpub-home-m-mid', dMid: 'webpub-home-d-mid' },
      written: (s) => `
        <p><strong>Hero:</strong> title ${quote(q(s, 'home.hero.title', 'Welcome to OLSC Lebanon – RedLeb Hub'))}; supporting line about community hub; button ${quote(q(s, 'home.hero.primaryCta', 'Become a member'))}.</p>
        <p><strong>Feed:</strong> heading ${quote(q(s, 'home.feed.heading', 'Latest from us'))}; columns ${quote(q(s, 'home.feed.newsHeading', 'Club News (OLSC announcements)'))} and ${quote(q(s, 'home.feed.eventsHeading', 'Events (Gatherings & meetups)'))} with cards from the database.</p>
        <p><strong>Community highlights:</strong> rotating gallery album covers (automatic slideshow).</p>
        <p><strong>Bottom invite:</strong> ${quote(q(s, 'home.bottom.title', 'Interested in joining us?'))} and ${quote(q(s, 'home.bottom.body', 'Let us cheer for the Reds together.'))}</p>
        <p><strong>Header/footer:</strong> ribbon ${quote(q(s, 'public.header.ribbon', 'OLSC Lebanon · RedLeb Hub'))}; menu labels such as ${quote(q(s, 'nav.public.about', 'About'))}, ${quote(q(s, 'nav.public.events', 'Events'))}, ${quote(q(s, 'nav.public.news', 'News'))}; footer blurb begins ${quote((q(s, 'footer.blurb') || '').slice(0, 60))}…</p>`,
      sources: () => blockList([
        'Hero title, buttons, feed headings, and bottom lines — <strong>Texts &amp; labels</strong> (editable).',
        'News and event cards — <strong>published items</strong> from Admin → News / Events.',
        'Gallery highlight images — <strong>Gallery albums</strong> uploaded by the committee.',
        'Navigation and footer — <strong>Texts &amp; labels</strong> plus logo from <strong>Settings / Design</strong>.',
      ]),
      howTo: [
        'Change the welcome line: Admin → Texts &amp; labels → search “Welcome to OLSC”.',
        'Change “Let us cheer for the Reds together.” the same way (search the sentence).',
        'Publish a news story: Admin → News → draft, preview, publish.',
        'Add an event to the home list: Admin → Events → create and keep it upcoming.',
        'Swap logo or colours: Admin → Settings or Design.',
      ],
    },
    {
      slug: 'web-page-about',
      title: 'Public page — About',
      shots: { mTop: 'webpub-about-m-top', dTop: 'webpub-about-d-top', mMid: 'webpub-about-m-mid', dMid: 'webpub-about-d-mid' },
      written: () => `<p>Hero and sections from the About CMS page (mission, story, values). Exact sentences appear in the screenshots.</p>${cmsSummary(snap, 'ABOUT')}`,
      sources: () =>
        blockList([
          'Body sections — <strong>Pages (CMS)</strong> for About, or quick <strong>inline edit</strong> on /about while signed in as admin.',
          'Page title in the browser header — <strong>Texts &amp; labels</strong> if used on this template.',
        ]),
      howTo: [
        'Admin → Pages (CMS) → About → edit a section → Save.',
        'Or open /about while signed in as admin → Edit mode → click highlighted text → Save changes.',
      ],
    },
    {
      slug: 'web-page-committee',
      title: 'Public page — Committee',
      shots: { mTop: 'webpub-committee-m-top', dTop: 'webpub-committee-d-top', mMid: 'webpub-committee-m-mid', dMid: 'webpub-committee-d-mid' },
      written: () => `<p>Introduces the OLSC Lebanon committee — roles and how to reach them (demo text).</p>${cmsSummary(snap, 'COMMITTEE')}`,
      sources: () =>
        blockList(['All structured blocks — <strong>CMS → Committee page</strong>.', 'Contact e-mails in the page may mirror <strong>Settings</strong> contact fields.']),
      howTo: ['Admin → Pages → Committee → edit sections.', 'Update contact details in Admin → Settings if the page pulls shared contact info.'],
    },
    {
      slug: 'web-page-events',
      title: 'Public page — Events listing',
      shots: { mTop: 'webpub-events-m-top', dTop: 'webpub-events-d-top', mMid: 'webpub-events-m-mid', dMid: 'webpub-events-d-mid' },
      written: (s) =>
        `<p>List heading and helper text from Texts &amp; labels where configured. Cards show titles such as ${quote('Committee Demo Watch Party')} (fictional).</p>`,
      sources: () =>
        blockList([
          'Each event card — <strong>Admin → Events</strong> (title, date, venue, description).',
          'Static labels on the listing — <strong>Texts &amp; labels</strong>.',
        ]),
      howTo: ['Admin → Events → New event → fill details → save.', 'Toggle registration and guest rules on the same form.', 'Unpublish by closing registration or editing dates.'],
    },
    {
      slug: 'web-page-event-detail',
      title: 'Public page — Event detail',
      shots: { mTop: 'webpub-event-detail-m-top', dTop: 'webpub-event-detail-d-top', mMid: 'webpub-event-detail-m-mid', dMid: 'webpub-event-detail-d-mid' },
      written: () => `<p>Title, description, venue, date/time, and sign-up controls for one event. Guest dropdown (+1 / +2) when enabled.</p>`,
      sources: () => blockList(['Entire page body — the <strong>event record</strong> from Admin → Events.', 'Guest policy — <strong>Settings</strong> (guest limits).']),
      howTo: ['Edit the event in Admin → Events.', 'Export guest list from admin when you need a spreadsheet for the venue.'],
    },
    {
      slug: 'web-page-news',
      title: 'Public page — News listing',
      shots: { mTop: 'webpub-news-m-top', dTop: 'webpub-news-d-top', mMid: 'webpub-news-m-mid', dMid: 'webpub-news-d-mid' },
      written: () => `<p>Headline list of published club news stories (demo article titles in screenshots).</p>`,
      sources: () => blockList(['Story cards — <strong>Admin → News</strong> (published only).', 'Listing headings — <strong>Texts &amp; labels</strong>.']),
      howTo: ['Admin → News → write story → save draft → publish when ready.'],
    },
    {
      slug: 'web-page-news-detail',
      title: 'Public page — News article',
      shots: { mTop: 'webpub-news-detail-m-top', dTop: 'webpub-news-detail-d-top', mMid: 'webpub-news-detail-m-mid', dMid: 'webpub-news-detail-d-mid' },
      written: () => `<p>Full article title, body, hero image, and (for signed-in members) reactions/comments on the member view — public visitors see the article without comments.</p>`,
      sources: () => blockList(['Article — <strong>Admin → News</strong>.', 'Comments — member-generated; committee moderates in Admin → Moderation.']),
      howTo: ['Edit the story in Admin → News.', 'Pin or unpublish by toggling status on the same screen.'],
    },
    {
      slug: 'web-page-newsletter',
      title: 'Public page — Newsletter archive',
      shots: { mTop: 'webpub-newsletter-m-top', dTop: 'webpub-newsletter-d-top', mMid: 'webpub-newsletter-m-mid', dMid: 'webpub-newsletter-d-mid' },
      written: () => `<p>List of PDF newsletter issues with issue titles and dates (demo).</p>`,
      sources: () => blockList(['Each issue — <strong>Admin → Newsletter</strong>.']),
      howTo: ['Admin → Newsletter → upload PDF → set title → publish or schedule.'],
    },
    {
      slug: 'web-page-newsletter-detail',
      title: 'Public page — Newsletter issue',
      shots: {
        mTop: 'webpub-newsletter-detail-m-top',
        dTop: 'webpub-newsletter-detail-d-top',
        mMid: 'webpub-newsletter-detail-m-mid',
        dMid: 'webpub-newsletter-detail-d-mid',
      },
      written: () => `<p>Embedded PDF viewer or download link for one issue.</p>`,
      sources: () => blockList(['PDF file and metadata — <strong>Admin → Newsletter</strong> for that issue.']),
      howTo: ['Replace the PDF in Admin → Newsletter → edit issue → upload new file → save.'],
    },
    {
      slug: 'web-page-gallery',
      title: 'Public page — Gallery',
      shots: { mTop: 'webpub-gallery-m-top', dTop: 'webpub-gallery-d-top', mMid: 'webpub-gallery-m-mid', dMid: 'webpub-gallery-d-mid' },
      written: () => `<p>Grid of photo albums (demo album ${quote('Demo Kop Photos 2026')} in this pack).</p>`,
      sources: () => blockList(['Albums and cover images — <strong>Admin → Gallery</strong> (or CMS if configured).', 'Intro text — <strong>Texts &amp; labels</strong> or CMS Gallery page.']),
      howTo: ['Create album in admin → upload photos → set cover image.', 'Homepage slideshow picks recent album covers automatically.'],
    },
    {
      slug: 'web-page-gallery-album',
      title: 'Public page — Gallery album',
      shots: { mTop: 'webpub-gallery-album-m-top', dTop: 'webpub-gallery-album-d-top', mMid: 'webpub-gallery-album-m-mid', dMid: 'webpub-gallery-album-d-mid' },
      written: () => `<p>Album title and photo grid; tap opens lightbox when enabled.</p>`,
      sources: () => blockList(['Photos — same album in <strong>Admin → Gallery</strong>.']),
      howTo: ['Add or remove images in the album editor; save to update the public grid.'],
    },
    {
      slug: 'web-page-membership',
      title: 'Public page — Membership',
      shots: { mTop: 'webpub-membership-m-top', dTop: 'webpub-membership-d-top', mMid: 'webpub-membership-m-mid', dMid: 'webpub-membership-d-mid' },
      written: () => `<p>Explains membership packages, fees, and how to apply (CMS sections).</p>${cmsSummary(snap, 'MEMBERSHIP')}`,
      sources: () =>
        blockList([
          'Long-form sections — <strong>CMS → Membership</strong> or inline edit.',
          'Payment instructions — often <strong>Settings</strong> (payment text) plus CMS.',
        ]),
      howTo: ['Admin → Pages → Membership.', 'Update payment wording in Admin → Settings → payment section.'],
    },
    {
      slug: 'web-page-apply',
      title: 'Public page — Membership application',
      shots: { mTop: 'webpub-apply-m-top', dTop: 'webpub-apply-d-top', mMid: 'webpub-apply-m-mid', dMid: 'webpub-apply-d-mid' },
      written: (s) =>
        `<p>Form fields for name, e-mail, phone, address, ALLRED SUPPORT ID (${quote(q(s, 'label.allredSupportId', 'ALLRED SUPPORT ID'))}), package choice, and payment confirmation checkbox. Submit button label from Texts.</p>`,
      sources: () =>
        blockList([
          'Field labels — <strong>Texts &amp; labels</strong> and form registry.',
          'Packages shown — <strong>Settings / membership packages</strong> in admin.',
          'Submissions — stored for <strong>Admin → Applications</strong> (not edited on this page).',
        ]),
      howTo: [
        'Change a label: Admin → Texts &amp; labels → search the words on the form.',
        'Review submissions: Admin → Applications (separate from this public form).',
      ],
    },
    {
      slug: 'web-page-contact',
      title: 'Public page — Contact',
      shots: { mTop: 'webpub-contact-m-top', dTop: 'webpub-contact-d-top', mMid: 'webpub-contact-m-mid', dMid: 'webpub-contact-d-mid' },
      written: () => `<p>Contact headings, e-mail, phone, and map/links (demo).</p>${cmsSummary(snap, 'CONTACT')}`,
      sources: () => blockList(['CMS Contact page', 'Shared phone/e-mail — <strong>Settings</strong>.']),
      howTo: ['Admin → Settings → update contact fields.', 'Admin → Pages → Contact for extra paragraphs.'],
    },
    {
      slug: 'web-page-login',
      title: 'Public page — Sign in',
      shots: { mTop: 'webpub-login-m', dTop: 'webpub-login-d', mMid: null, dMid: null },
      written: (s) =>
        `<p>Heading Sign in to RedLeb Hub; fields for username/e-mail and password; button ${quote(q(s, 'auth.signIn.submit', 'Sign in'))}; links to sign up and forgot password.</p>`,
      sources: () => blockList(['Labels — <strong>Texts &amp; labels</strong> (Auth area).', 'Accounts — created by committee invites or sign-up rules in Settings.']),
      howTo: ['Admin → Texts → search “Sign in”.', 'Help a stuck member: Admin → Members → reset password.'],
    },
    {
      slug: 'web-page-signup',
      title: 'Public page — Sign up',
      shots: { mTop: 'webpub-signup-m', dTop: 'webpub-signup-d', mMid: null, dMid: null },
      written: () => `<p>Self-service registration fields when sign-up is enabled (demo policy).</p>`,
      sources: () => blockList(['Field labels — Texts &amp; labels.', 'Whether sign-up is open — <strong>Settings</strong>.']),
      howTo: ['Toggle public sign-up in Admin → Settings if the committee wants invite-only access.'],
    },
    {
      slug: 'web-page-forgot',
      title: 'Public page — Forgot password',
      shots: { mTop: 'webpub-forgot-m', dTop: null, mMid: null, dMid: null },
      written: () => `<p>E-mail field to request a reset link (requires mail server in production).</p>`,
      sources: () => blockList(['Instructions — Texts &amp; labels.', 'E-mail delivery — server configuration (not in this PDF).']),
      howTo: ['Edit helper text in Texts &amp; labels; test reset flow before launch.'],
    },
    {
      slug: 'web-page-offline',
      title: 'Public page — Offline',
      shots: { mTop: 'webpub-offline-m', dTop: null, mMid: null, dMid: null },
      written: () => `<p>Short message when the phone has no connection; ${quote('Try again')} button.</p>`,
      sources: () => blockList(['Offline strings — bundled copy (updated at build); mirror in Texts where wired.']),
      howTo: ['Most committees do not edit this often; ask your tech helper if wording must change.'],
    },
  ];

  for (const p of pages) {
    sections.push(publicPage(ctx, snap, p));
  }

  // —— ADDITION 2 ——
  sections.push(
    sheet(
      ctx,
      'edit-guide-intro',
      'Editing the website: the complete guide',
      `<p>Three friendly ways to change what visitors see — use the one that matches the type of content.</p>
      <table class="status compact">
        <tr><th>Method</th><th>Best for</th><th>Who</th></tr>
        <tr><td>① Inline edit on the live page</td><td>CMS pages (About, Membership, Contact…)</td><td>Admins while signed in</td></tr>
        <tr><td>② Texts &amp; labels</td><td>Buttons, headings, menu names, form labels</td><td>Content Manager+</td></tr>
        <tr><td>③ Settings / Branding / Design</td><td>Logo, colours, contact info, payment text, feature switches</td><td>Super Admin / Committee Admin</td></tr>
      </table>`,
      'edit-guide-sheet guide-sheet',
    ),
  );

  const editShots = (id, fallback) => {
    const f = ctx.shotFile(id, fallback);
    return ctx.annotated(f, ctx.manifest.shots[id]?.markers ?? []);
  };

  sections.push(
    sheet(
      ctx,
      'edit-method-inline',
      'Method ① — Inline edit on the page',
      `${editShots('edit-inline-about', 'edit-inline-about.png')}
      <ol class="steps">
        <li>Sign in with an admin account.</li>
        <li>Open a CMS page (for example About).</li>
        <li>When the yellow toolbar appears, tap a highlighted paragraph.</li>
        <li>Tap <strong>Save changes</strong> — visitors see updates immediately.</li>
      </ol>
      <p class="note"><strong>Cannot:</strong> change news stories, events, or gallery photos here — use their admin screens.</p>`,
      'edit-guide-sheet guide-sheet',
    ),
  );

  sections.push(
    sheet(
      ctx,
      'edit-method-texts',
      'Method ② — Texts &amp; labels',
      `${editShots('edit-texts-hero', 'edit-texts-hero.png')}
      <ol class="steps">
        <li>Admin → Texts &amp; labels.</li>
        <li>Search plain English (for example “Welcome to OLSC”).</li>
        <li>Edit the value → Save.</li>
        <li>Open the public site in a private window to double-check.</li>
      </ol>
      <p class="note"><strong>Can:</strong> menu names, hero lines, footer, auth labels, many member-app labels.<br/><strong>Cannot:</strong> full news articles (use News admin).</p>`,
      'edit-guide-sheet guide-sheet',
    ),
  );

  sections.push(
    sheet(
      ctx,
      'edit-method-settings',
      'Method ③ — Settings, Branding, Design',
      `<div class="two-col">${editShots('edit-settings', 'edit-settings-contact.png')}${editShots('edit-design', 'edit-design-branding.png')}</div>
      <ol class="steps">
        <li><strong>Settings</strong> — contact e-mail, phone, payment instructions, feature toggles.</li>
        <li><strong>Design</strong> — colours and visual tokens tied to the OLSC look.</li>
        <li>Upload the official logo when you have the file (Settings).</li>
      </ol>`,
      'edit-guide-sheet guide-sheet',
    ),
  );

  const walkthroughs = [
    {
      slug: 'edit-ex-hero',
      title: 'Walkthrough — Change the home welcome title',
      shot: ['edit-texts-hero', 'edit-home-after-hero'],
      steps: [
        'Texts &amp; labels → search “Welcome to OLSC”.',
        'Edit → Save.',
        'Open the public home (screenshot on the right shows what visitors see).',
      ],
    },
    {
      slug: 'edit-ex-button',
      title: 'Walkthrough — Change a button label and link target',
      bodyExtra:
        '<p>Button <em>labels</em> live in Texts. The <em>destination</em> (for example /membership/apply) is fixed in the app — you rename the label, not the route. Custom extra pages are <strong>Coming next</strong>.</p>',
      shot: ['edit-texts-hero'],
      steps: ['Find “Become a member” in Texts.', 'Rename it (keep it short on mobile).', 'Save and tap the button on the home page to test.'],
    },
    {
      slug: 'edit-ex-menu',
      title: 'Walkthrough — Rename a menu item',
      shot: ['edit-texts-hero'],
      steps: [
        'Texts &amp; labels → search the current menu word (for example “Gallery”).',
        'Edit the “nav.public…” entry.',
        'Save — menu updates everywhere.',
        'Hiding a item entirely is not drag-and-drop yet — <strong>Coming next</strong> (today you can rename only).',
      ],
    },
    {
      slug: 'edit-ex-footer',
      title: 'Walkthrough — Footer blurb',
      shot: ['edit-texts-hero'],
      steps: ['Search “digital home of Liverpool” in Texts.', 'Edit footer blurb → Save.'],
    },
    {
      slug: 'edit-ex-image',
      title: 'Walkthrough — Replace an image',
      shot: ['edit-cms-membership', 'edit-inline-about'],
      steps: [
        'CMS hero/banner images: Admin → Pages → pick section → upload.',
        'Logo: Admin → Settings → upload logo file.',
        'News hero images: Admin → News → edit story.',
      ],
    },
    {
      slug: 'edit-ex-payment',
      title: 'Walkthrough — Payment details on Membership',
      shot: ['edit-settings'],
      steps: ['Admin → Settings → payment instructions.', 'Admin → Pages → Membership to adjust explanatory paragraphs.', 'Save both — reload /membership.'],
    },
    {
      slug: 'edit-ex-brand',
      title: 'Walkthrough — Logo and colours',
      shot: ['edit-design', 'edit-settings'],
      steps: ['Upload logo in Settings.', 'Tune colours in Design (preview on a phone).', 'Keep contrast readable in sunlight.'],
    },
    {
      slug: 'edit-ex-ar',
      title: 'Walkthrough — Arabic text',
      shot: ['edit-texts-ar'],
      steps: [
        'Switch language to العربية in Texts (top of screen).',
        'Edit the matching row — or import Arabic preset if offered.',
        'Have a native speaker review before go-live.',
        'Visitors switch language from the header control (see visitor section).',
      ],
    },
    {
      slug: 'edit-ex-undo',
      title: 'Walkthrough — Undo a text change',
      shot: ['edit-texts-hero'],
      steps: [
        'Open the row in Texts &amp; labels.',
        'Use <strong>Rollback</strong> to restore the previous saved version.',
        'Revision list shows recent values for that label.',
      ],
    },
    {
      slug: 'edit-ex-default',
      title: 'Walkthrough — Restore original wording',
      shot: ['edit-texts-hero'],
      steps: ['In Texts, use reset/restore default for that label (per language).', 'Panic restore (all labels) exists for emergencies — Super Admin only, type the confirm phrase.'],
    },
    {
      slug: 'edit-ex-audit',
      title: 'Walkthrough — See who changed what',
      shot: ['edit-audit-content'],
      steps: ['Admin → Change history (audit).', 'Filter by date.', 'Pair with Texts rollback if you need to revert.'],
    },
  ];

  for (const w of walkthroughs) {
    const shots = (w.shot || []).map((id) => editShots(id, `${id}.png`)).join('');
    sections.push(
      sheet(
        ctx,
        w.slug,
        w.title,
        `${shots}${w.bodyExtra ?? ''}<ol class="steps">${w.steps.map((s) => `<li>${s}</li>`).join('')}</ol>`,
        'edit-guide-sheet guide-sheet',
      ),
    );
  }

  sections.push(
    sheet(
      ctx,
      'edit-publish',
      'Publish, preview and undo',
      `<motion class="two-col">${editShots('edit-news-draft', 'edit-news-publish.png')}${editShots('edit-newsletter-schedule', 'edit-newsletter-schedule.png')}</motion>`
        .replace('<motion', '<div')
        .replace('</motion>', '</div>') +
        `<ul>
        <li><strong>News</strong> — draft in admin, publish when ready (no separate public preview URL — use draft status and open the story when published).</li>
        <li><strong>Newsletter PDF</strong> — save draft, optional scheduled publish time, then publish.</li>
        <li><strong>CMS pages</strong> — save in admin or inline; there is no sitewide “preview server” — check while signed in, then sign out to see the visitor view.</li>
        <li><strong>Texts</strong> — save is live immediately; use rollback/history to undo.</li>
        <li><strong>Site-wide rewind to a calendar date</strong> — not available yet (<strong>Coming next</strong>); use audit + rollback per item today.</li>
      </ul>`,
      'edit-guide-sheet guide-sheet',
    ),
  );

  const matrixRows = [
    ['Home hero', quote(q(snap, 'home.hero.title')), 'Texts &amp; labels', 'Content Manager+'],
    ['Home bottom line', quote(q(snap, 'home.bottom.body')), 'Texts &amp; labels', 'Content Manager+'],
    ['About story', 'CMS sections', 'Pages (CMS) or inline', 'Content Manager+'],
    ['Membership fees text', 'CMS + Settings payment', 'Pages + Settings', 'Committee Admin+'],
    ['Event card', 'Event title/date', 'Admin → Events', 'Event Manager+'],
    ['News article', 'Headline &amp; body', 'Admin → News', 'Content Manager+'],
    ['Gallery album', 'Photos', 'Admin → Gallery', 'Content Manager+'],
    ['Menu “Events”', quote(q(snap, 'nav.public.events', 'Events')), 'Texts &amp; labels', 'Content Manager+'],
    ['Logo', 'Image file', 'Settings / Design', 'Super Admin'],
    ['Application form labels', 'Field names', 'Texts &amp; labels', 'Content Manager+'],
  ];

  sections.push(
    sheet(
      ctx,
      'edit-matrix',
      'Quick map — Page → text → where to edit → who',
      `<table class="status compact">
        <tr><th>Page</th><th>What&rsquo;s written</th><th>Where to edit</th><th>Who</th></tr>
        ${matrixRows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}
      </table>`,
      'edit-guide-sheet guide-sheet',
    ),
  );

  sections.push(
    sheet(
      ctx,
      'edit-dodont',
      'Do and don&rsquo;t for admins',
      `<ul>
        <li><strong>Do</strong> keep button labels short — they wrap on small phones.</li>
        <li><strong>Do</strong> add meaningful alt text when you upload images in news or CMS.</li>
        <li><strong>Do</strong> read aloud once before publishing a long paragraph.</li>
        <li><strong>Do</strong> check Arabic after import — machine translation is only a start.</li>
        <li><strong>Don&rsquo;t</strong> paste member phone numbers into demo screenshots for real launches.</li>
        <li><strong>Don&rsquo;t</strong> delete applications in admin unless you are sure — use reject instead.</li>
      </ul>`,
      'edit-guide-sheet guide-sheet',
    ),
  );

  const faq = [
    {
      q: 'I changed a text but I cannot see it.',
      a: 'Hard-refresh the page, or open a private window. Make sure you edited the correct language (EN vs AR).',
    },
    {
      q: 'How do I add a brand-new page to the menu?',
      a: 'Not available as drag-and-drop yet — <strong>Coming next</strong>. Today you edit existing pages (About, Membership, etc.).',
    },
    {
      q: 'How do I change the menu order?',
      a: 'Fixed order in the app for now — <strong>Coming next</strong>. You can rename items in Texts.',
    },
    {
      q: 'Can I edit Arabic?',
      a: 'Yes — Texts &amp; labels with language العربية, plus Arabic CMS content where provided.',
    },
    {
      q: 'How do I hide a news post?',
      a: 'Admin → News → unpublish or return to draft.',
    },
    {
      q: 'Who can edit payment instructions?',
      a: 'Usually Super Admin or Committee Admin in Settings.',
    },
    {
      q: 'Can I schedule a website-wide freeze?',
      a: 'No sitewide scheduler yet — schedule individual newsletters; everything else publishes on save.',
    },
    {
      q: 'Where is the old wording?',
      a: 'Texts → open the row → revision list → Rollback.',
    },
  ];

  sections.push(
    sheet(
      ctx,
      'edit-faq',
      'Common questions',
      `<div class="qa">${faq.map((f) => `<p><strong>Q:</strong> ${f.q}<br/><strong>A:</strong> ${f.a}</p>`).join('')}</div>`,
      'edit-guide-sheet guide-sheet',
    ),
  );

  // —— ADDITION 3 ——
  sections.push(
    sheet(
      ctx,
      'inventory-intro',
      'Website content inventory (appendix)',
      `<p>Important wording on the public site (readable names — not internal codes). English and Arabic values come from this demo database.</p>
      ${ctx.headsUp('Arabic may show “not set yet” until the committee imports or types translations.')}`,
      'inventory-sheet guide-sheet',
    ),
  );

  const inv = snap.inventory ?? [];
  const perPage = 22;
  for (let i = 0; i < inv.length; i += perPage) {
    const chunk = inv.slice(i, i + perPage);
    sections.push(
      sheet(
        ctx,
        `inventory-${Math.floor(i / perPage) + 1}`,
        `Content inventory (continued ${i + 1}–${i + chunk.length})`,
        `<table class="status inventory">
          <tr><th>Label</th><th>English on site</th><th>Arabic</th><th>Shown on</th><th>Edit in</th></tr>
          ${chunk
            .map(
              (row) =>
                `<tr><td>${row.label}</td><td>${String(row.currentEn).slice(0, 80)}${String(row.currentEn).length > 80 ? '…' : ''}</td><td>${String(row.currentAr).slice(0, 50)}${String(row.currentAr).length > 50 ? '…' : ''}</td><td>${row.appearsOn}</td><td>${row.editIn}</td></tr>`,
            )
            .join('')}
        </table>`,
        'inventory-sheet guide-sheet',
      ),
    );
  }

  return sections.join('\n');
}