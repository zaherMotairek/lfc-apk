#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildWebsiteExpansion } from './build-committee-website-expansion.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs/committee-presentation');
const shotsDir = path.join(outDir, 'shots');
const manifestPath = path.join(outDir, 'shots-manifest.json');

const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  : { shots: {} };

let pageNum = 0;
const pageIndex = [];

function nextId(slug) {
  pageNum += 1;
  pageIndex.push({ slug, page: pageNum });
  return `p-${pageNum}-${slug}`;
}

function shotFile(id, fallback) {
  const m = manifest.shots[id];
  if (m?.file && fs.existsSync(path.join(shotsDir, m.file))) return m.file;
  if (fs.existsSync(path.join(shotsDir, fallback))) return fallback;
  return null;
}

function annotated(file, markers) {
  if (!file) return '<p class="note">Screenshot pending — re-run capture.</p>';
  const ms = markers ?? [];
  const dots = ms
    .map(
      (m) =>
        `<span class="marker" style="left:${m.xPct}%;top:${m.yPct}%;" title="${m.label}">${m.n}</span>`,
    )
    .join('');
  const legend = ms.length
    ? `<ol class="legend">${ms.map((m) => `<li><strong>${m.n}.</strong> ${m.label}</li>`).join('')}</ol>`
    : '';
  const isMobile =
    file.includes('mem-') || file.includes('mobile') || (file.startsWith('webpub-') && file.includes('-m'));
  const wrap = isMobile
    ? `<div class="phone-wrap"><div class="phone shot-frame"><img src="shots/${file}" alt="" />${dots}</div></div>`
    : `<div class="desk-wrap shot-frame"><img class="desktop-shot" src="shots/${file}" alt="" />${dots}</div>`;
  return `${wrap}${legend}`;
}

function sheet(id, title, body, footerNote = '') {
  const pid = nextId(id);
  return `<section class="sheet guide-sheet" id="${pid}">
  <h2>${title}</h2>
  ${body}
  <div class="footer">RedLeb Hub – OLSC Lebanon · ${footerNote || title}</div>
</section>`;
}

function tip(text) {
  return `<p class="tip"><strong>Tip:</strong> ${text}</p>`;
}

function headsUp(text) {
  return `<p class="heads-up"><strong>Heads up:</strong> ${text}</p>`;
}

function qa(items) {
  return `<motion class="qa">${items
    .map((q) => `<p><strong>Q:</strong> ${q.q}<br/><strong>A:</strong> ${q.a}</p>`)
    .join('')}</motion>`.replaceAll('<motion class="qa">', '<div class="qa">').replaceAll('</motion>', '</div>');
}

function guidePage(id, title, shotKey, fallback, copy) {
  const file = shotFile(shotKey, fallback);
  const markers = manifest.shots[shotKey]?.markers ?? [];
  return sheet(
    id,
    title,
    `
    <div class="guide-grid">
      <div class="guide-shot">${annotated(file, markers)}</div>
      <div class="guide-text">
        <h3>What you see</h3>
        <p>${copy.see}</p>
        <h3>What you can do</h3>
        <p>${copy.do}</p>
        <h3>How to</h3>
        <ol class="steps">${copy.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
        ${copy.tip ? tip(copy.tip) : ''}
        ${copy.headsUp ? headsUp(copy.headsUp) : ''}
        ${copy.qa ? qa(copy.qa) : ''}
      </div>
    </div>`,
  );
}

function adminPage(id, title, shotKey, fallback, copy) {
  const file = shotFile(shotKey, fallback);
  const markers = manifest.shots[shotKey]?.markers ?? [];
  return sheet(
    id,
    title,
    `
    <p>${copy.for}</p>
    ${annotated(file, markers)}
    <h3>Step by step</h3>
    <ol class="steps">${copy.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
    ${copy.good ? `<p class="note"><strong>Good to know:</strong> ${copy.good}</p>` : ''}
    ${copy.qa ? qa(copy.qa) : ''}`,
  );
}

const visitorPages = [
  guidePage('pub-home', 'Public home', 'pub-home-top', 'pub-home-top.png', {
    see: 'Welcome message, news, and the path to membership.',
    do: 'Browse as a guest before you apply or sign in.',
    steps: ['Open the site on your phone.', 'Scroll for events and news.', 'Tap Become a member when you are ready.'],
  }),
  guidePage('pub-gallery', 'Gallery', 'pub-gallery', 'pub-gallery.png', {
    see: 'Photo albums from events (demo placeholder images in this pack).',
    do: 'Tap an album to flip through pictures.',
    steps: ['Open Gallery from the menu.', 'Pick an album.', 'Swipe through photos.'],
  }),
  guidePage('pub-gallery-album', 'Inside an album', 'pub-gallery-album', 'pub-gallery-album.png', {
    see: 'A grid of photos from a single event.',
    do: 'Share memories after watch parties.',
    steps: ['Open any album.', 'Tap a photo if a lightbox opens.', 'Go back to the site menu to explore more.'],
  }),
  guidePage('pub-apply', 'Application form checks', 'pub-apply-validation', 'pub-apply-validation.png', {
    see: 'Required fields highlighted if you tap Submit too soon.',
    do: 'Fill the form carefully so the committee can review faster.',
    steps: ['Open Membership → Apply.', 'Complete every required field.', 'Tick the payment confirmation box, then submit.'],
    headsUp: 'All names and numbers in this demo PDF are fictional.',
  }),
  guidePage('pub-lang', 'English ↔ Arabic', 'pub-lang-ar', 'pub-language-ar.png', {
    see: 'The site flips to Arabic with right-to-left layout.',
    do: 'Switch language any time from the header.',
    steps: ['Use the language control at the top.', 'Pick العربية or English.', 'Browse again in your chosen language.'],
  }),
];

const memberPages = [
  guidePage('mem-home', 'Member home', 'mem-home-top', 'mem-home-top.png', {
    see: 'Shortcuts to your card, matches, community, and events.',
    do: 'Jump straight to what you need on matchday.',
    steps: ['Open the app and sign in.', 'Tap any tile to open that area.', 'Pull down to refresh lists.'],
    tip: 'Add the site to your home screen so it opens like an app.',
    qa: [{ q: 'Do I need a new login every time?', a: 'No — stay signed in on your own phone.' }],
  }),
  guidePage('mem-card', 'Digital membership card', 'mem-card', 'mem-card.png', {
    see: 'Your name, member status, and a QR code the committee can scan at events.',
    do: 'Show this screen instead of digging for a paper card.',
    steps: ['Tap Membership card from home.', 'Show the QR at the door.', 'Optionally upload a photo of your printed card.'],
    headsUp: 'Official membership still comes from the committee — this is your digital companion.',
  }),
  guidePage('mem-matches', 'Match Hub — fixtures', 'mem-matches', 'mem-matches.png', {
    see: 'Upcoming Liverpool matches open for predictions.',
    do: 'Pick a match and enter your prediction before the deadline.',
    steps: ['Tap Matches.', 'Choose a fixture.', 'Open it to enter scores and bonus picks.'],
  }),
  guidePage('mem-predict', 'Making a prediction', 'mem-match-hub', 'mem-match-hub.png', {
    see: 'Your score guess and optional extras before kick-off.',
    do: 'Earn season points — no coins or gimmicks.',
    steps: ['Fill in the score you expect.', 'Add optional picks if shown.', 'Tap submit before the countdown ends.'],
    qa: [{ q: 'Can I change my mind?', a: 'Yes, until predictions close for that match.' }],
  }),
  guidePage('mem-leaderboard', 'Leaderboard', 'mem-leaderboard', 'mem-leaderboard.png', {
    see: 'Rankings by prediction points for the season.',
    do: 'See how you compare with friends in the supporters club.',
    steps: ['Open Leaderboard from the menu.', 'Scroll to find your name.', 'Opt out in profile if you want privacy.'],
  }),
  guidePage('mem-community', 'Community feed', 'mem-community', 'mem-community.png', {
    see: 'News, events, and achievements mixed in one timeline.',
    do: 'Tap an item to read the full story or sign up for an event.',
    steps: ['Open Community.', 'Tap any card to open details.', 'Register for events right from the feed when signed in.'],
  }),
  guidePage('mem-news', 'News story + comments', 'mem-news-detail', 'mem-news-detail.png', {
    see: 'Full article with likes and comments from members.',
    do: 'Join the conversation after a match or announcement.',
    steps: ['Open a story from Community or News.', 'Tap a reaction if you want.', 'Leave a short comment when signed in.'],
    tip: 'The committee can hide rude comments from the moderation screen.',
  }),
  guidePage('mem-notifications', 'Notifications', 'mem-notifications', 'mem-notifications.png', {
    see: 'Alerts about events, matches, and welcome messages.',
    do: 'Mark items as read and jump to the related page.',
    steps: ['Open Notifications.', 'Tap a row to follow the link.', 'Turn on phone alerts in your profile when offered.'],
    headsUp: 'Push alerts need a secure site address in production — your tech person sets that up once.',
  }),
  guidePage('mem-profile', 'Your profile', 'mem-profile', 'mem-profile.png', {
    see: 'Your details, OLSC ID, and ALLRED SUPPORT ID.',
    do: 'Keep contact info current so the committee can reach you.',
    steps: ['Open Profile.', 'Edit fields and save.', 'Change your password from the same area.'],
  }),
  guidePage('mem-events', 'Events & guests', 'mem-event-detail', 'mem-event-detail.png', {
    see: 'Event info plus sign-up with +1 or +2 guests when allowed.',
    do: 'Tell the committee how many seats you need.',
    steps: ['Pick an event.', 'Choose guest count if bringing friends.', 'Confirm registration — cancel if plans change.'],
    tip: 'If the event is full, join the waitlist — you will be notified if a spot opens.',
  }),
  guidePage('mem-hof', 'Hall of Fame', 'mem-hof', 'mem-hall-of-fame.png', {
    see: 'Top predictors and recent achievements when the season is under way.',
    do: 'Celebrate active members — it fills up as more matches are played.',
    steps: ['Open Hall of Fame from the menu.', 'Browse top predictors.', 'Check back after big matches.'],
  }),
];

const adminPages = [
  adminPage('admin-dash', 'Admin dashboard', 'admin-dashboard', 'admin-dashboard.png', {
    for: 'Your morning overview and quick links into everyday tasks.',
    steps: ['Sign in with your committee account.', 'Use the shortcuts for news, events, or members.', 'Check counts before a busy matchday.'],
    good: 'Only people with the right role see sensitive areas like member records.',
    qa: [{ q: 'Can two admins work at once?', a: 'Yes — changes save straight away for everyone.' }],
  }),
  adminPage('admin-confirm', 'Confirmation dialog', 'admin-confirm-dialog', 'admin-confirm-dialog.png', {
    for: 'A safety step before deletes or other risky actions.',
    steps: ['Start an action (e.g. delete an application).', 'Read the message.', 'Tap Cancel if you change your mind — or confirm if you are sure.'],
    good: 'Stops accidental taps when you are on a phone or in a hurry.',
  }),
  adminPage('admin-apps', 'Membership applications', 'admin-applications', 'admin-applications.png', {
    for: 'Review new join requests from the public form.',
    steps: [
      'Open Applications.',
      'Filter by pending, approved, or rejected.',
      'Approve when payment and details look good — or reject with a note.',
      'Export to Excel when you need a spreadsheet copy.',
    ],
    good: 'You stay in control — nothing activates until you say so.',
    qa: [{ q: 'Where does the official OLSC number go?', a: 'Add it when you approve, so the roster stays correct.' }],
  }),
  adminPage('admin-members', 'Users & members', 'admin-members', 'admin-members.png', {
    for: 'Search the roster, invite people, and import Excel.',
    steps: [
      'Search by name, e-mail, or ALLRED SUPPORT ID.',
      'Tap Edit to see last seen and activity.',
      'Send invites or reset a password when someone is stuck.',
    ],
    good: 'Passwords are stored securely — you never see what someone typed.',
    qa: [{ q: 'What is ALLRED SUPPORT ID?', a: 'The supporter reference shown to members; imports still accept the old spreadsheet column name.' }],
  }),
  adminPage('admin-activity', 'Member activity', 'admin-member-edit', 'admin-member-activity.png', {
    for: 'See when someone last logged in, joined events, and played predictions.',
    steps: ['Find the member.', 'Tap Edit.', 'Scroll the activity panel before you save.'],
    good: 'Useful when someone says “I cannot log in” — check last seen first.',
  }),
  adminPage('admin-events', 'Events', 'admin-events', 'admin-events.png', {
    for: 'Create watch parties, set capacity, and see who registered.',
    steps: ['Create or edit an event.', 'Set capacity and guest rules.', 'Export the guest list for the venue.'],
    qa: [{ q: 'Guests?', a: 'Members can add up to two guests when you turn that on in settings.' }],
  }),
  adminPage('admin-checkin', 'QR check-in', 'admin-checkin', 'admin-checkin.png', {
    for: 'Scan member cards at the door on matchday.',
    steps: ['Open Event check-in.', 'Pick today’s event.', 'Scan the QR from a member’s phone.'],
    good: 'Works with the digital card screen — no paper needed.',
  }),
  adminPage('admin-matches', 'Matches & results', 'admin-matches', 'admin-matches.png', {
    for: 'Add fixtures, close predictions, and enter scores.',
    steps: ['Create the match.', 'Close predictions before kick-off.', 'Enter the final score so points update.'],
  }),
  adminPage('admin-news', 'News', 'admin-news', 'admin-news.png', {
    for: 'Write stories for the public site and member feed.',
    steps: ['Draft the article.', 'Preview how it reads on mobile.', 'Publish when ready.'],
  }),
  adminPage('admin-newsletter', 'Newsletter', 'admin-newsletter', 'admin-newsletter.png', {
    for: 'Monthly PDF issues and optional e-mail to members.',
    steps: ['Upload or link the PDF.', 'Schedule a publish time.', 'Send to members when SMTP is configured.'],
    good: 'Sending e-mail needs a real sender address — plan that before launch.',
  }),
  adminPage('admin-texts', 'Texts & labels', 'admin-texts', 'admin-texts.png', {
    for: 'Change button labels, headings, and messages without a developer.',
    steps: ['Search for the wording you want to change.', 'Edit and save.', 'Use “restore defaults” if you need to undo everything in one language.'],
    good: 'You can undo text changes and review history when something looks wrong.',
    qa: [{ q: 'Arabic?', a: 'Import preset bundles, then let a native speaker review before go-live.' }],
  }),
  adminPage('admin-settings', 'Settings & branding', 'admin-settings', 'admin-settings.png', {
    for: 'Logo uploads, colour pickers, contact and payment text, and feature switches (on/off — not typing true/false).',
    steps: [
      'Open Branding for Choose image on logos.',
      'Open Features for switches and max guests.',
      'Save each tab after changes.',
    ],
    headsUp: 'Until the logo is uploaded, a temporary mark may show — that is normal.',
  }),
  adminPage('admin-cms', 'Pages & edit mode', 'admin-cms', 'admin-cms.png', {
    for: 'Structured sections for About, Membership, and more.',
    steps: ['Pick a page in the CMS list.', 'Edit sections and save.', 'Visit the live page while signed in to use quick edit mode on the text.'],
  }),
  adminPage('admin-mod', 'Moderation', 'admin-moderation', 'admin-moderation.png', {
    for: 'Hide inappropriate comments when someone reports them.',
    steps: ['Open Moderation.', 'Review flagged comments.', 'Hide or restore as needed.'],
  }),
  adminPage('admin-audit', 'Change history', 'admin-audit', 'admin-audit.png', {
    for: 'See who changed settings or content in the admin area.',
    steps: ['Open the audit list.', 'Filter by date or person.', 'Follow up if something looks unexpected.'],
    good: 'Handy after training a new volunteer admin.',
  }),
];

const intro = `
<section class="sheet cover" id="p-1-cover">
  <p class="lead">OLSC Lebanon · Committee pack + member guide</p>
  <h1>RedLeb Hub</h1>
  <p class="lead">Your digital home for supporters — presented in plain English</p>
  <p>15 November 2026</p>
  <span class="badge">Demo data only — every name, phone, and e-mail is fictional</span>
</section>

<section class="sheet" id="p-2-nutshell">
  <h2>In a nutshell</h2>
  <p>RedLeb Hub is the website and phone-friendly app for Liverpool supporters in Lebanon. Members get a card, predictions, and community tools. The committee runs content and members from a simple admin area — no developer for day-to-day edits.</p>
  <p class="note"><strong>Important:</strong> Official OLSC membership still comes from the committee. This platform supports people you have already approved.</p>
</section>

<section class="sheet" id="p-3-spaces">
  <h2>Three spaces</h2>
  <div class="grid-3">
    <div class="space-card"><strong>Visitors</strong>Discover, apply, read news.</div>
    <div class="space-card"><strong>Members</strong>Card, Match Hub, events, profile.</div>
    <div class="space-card"><strong>Committee</strong>Approve, publish, scan QR, edit texts.</div>
  </div>
</section>

<section class="sheet" id="p-4-toc">
  <h2>Contents</h2>
  <ol class="toc toc-list"></ol>
</section>

<section class="sheet" id="p-5-day">
  <h2>A day in the life of a member</h2>
  <ol class="steps">
    <li>Morning: check notifications for an upcoming watch party.</li>
    <li>Afternoon: submit a prediction before the deadline.</li>
    <li>Evening: show the QR card at the door (+1 guest if needed).</li>
    <li>After the match: peek at the leaderboard with mates.</li>
  </ol>
  <div class="phones">${['mem-notifications', 'mem-match-hub', 'mem-card', 'mem-leaderboard']
    .map((k) => {
      const f = shotFile(k, `${k}.png`);
      return f ? `<div class="phone"><img src="shots/${f}" alt=""/></div>` : '';
    })
    .join('')}</div>
</section>

<section class="sheet" id="p-admin-week">
  <h2>First week for a new admin</h2>
  <ol class="steps">
    <li>Sign in and skim the dashboard.</li>
    <li>Upload logo and contact details in Settings.</li>
    <li>Review pending applications.</li>
    <li>Publish one news story and one event.</li>
    <li>Ask another admin to double-check your changes in the change history list.</li>
  </ol>
</section>

<section class="sheet" id="p-roles">
  <h2>Who can do what</h2>
  <table class="status">
    <tr><th>Role</th><th>Typical use</th></tr>
    <tr><td>Super Admin</td><td>Everything, including settings and roles</td></tr>
    <tr><td>Committee Admin</td><td>Members, applications, invites</td></tr>
    <tr><td>Content Manager</td><td>News, CMS pages, texts</td></tr>
    <tr><td>Event Manager</td><td>Events, check-in, registrations</td></tr>
    <tr><td>Game Manager</td><td>Matches, predictions, scoring</td></tr>
    <tr><td>Member</td><td>Member app only</td></tr>
  </table>
</section>

<section class="sheet" id="p-install">
  <h2>Install on your phone</h2>
  <div class="two-col">
    <div>
      <h3>Android (Chrome)</h3>
      <ol class="steps"><li>Open the site.</li><li>Tap the menu (⋮).</li><li>Tap “Install app” or “Add to Home screen”.</li></ol>
    </div>
    <div>
      <h3>iPhone (Safari)</h3>
      <ol class="steps"><li>Open the site in Safari.</li><li>Tap Share.</li><li>Tap “Add to Home Screen”.</li></ol>
    </div>
  </div>
  ${tip('Installed once, it opens full screen like any other app.')}
</section>

<section class="sheet" id="p-status">
  <h2>Where we are today</h2>
  <table class="status">
    <tr><th>Area</th><th>Status</th></tr>
    <tr><td>Member app + admin</td><td class="tag-ready">Ready for pilot</td></tr>
    <tr><td>Settings (switches, logo upload)</td><td class="tag-ready">Ready for pilot</td></tr>
    <tr><td>Editable texts EN/AR</td><td class="tag-progress">Arabic needs committee review</td></tr>
    <tr><td>Newsletter e-mail send</td><td class="tag-progress">Needs real sender address</td></tr>
    <tr><td>Drag-and-drop page builder</td><td class="tag-later">Coming later</td></tr>
  </table>
</section>

<section class="sheet" id="p-next">
  <h2>Coming next</h2>
  <ul>
    <li>Partner perks with QR at shops</li>
    <li>Easier WhatsApp sharing for invites</li>
    <li>Photo wall and simple polls after events</li>
    <li>Monday e-mail summary for the committee</li>
  </ul>
</section>

<section class="sheet" id="p-need">
  <h2>What we need from the committee</h2>
  <ul>
    <li>Approve the RedLeb Hub name and look</li>
    <li>Logo file and permission to use it</li>
    <li>Official membership rules text</li>
    <li>Member spreadsheet for import</li>
    <li>Who gets which admin role</li>
    <li>Sender e-mail and website address for launch</li>
    <li>Arabic reviewer</li>
  </ul>
  <p><strong>Next step:</strong> a small pilot with trusted members.</p>
</section>
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>RedLeb Hub — Committee guide</title>
  <link rel="stylesheet" href="print.css" />
</head>
<body>
${intro}
<h2 class="section-break">For visitors</h2>
${visitorPages.join('')}
<h2 class="section-break">Member app</h2>
${memberPages.join('')}
<h2 class="section-break">Admin panel</h2>
${adminPages.join('')}
<h2 class="section-break">The public website &amp; editing guide</h2>
${buildWebsiteExpansion({ nextId, shotFile, annotated, manifest, tip, headsUp })}
<script>
document.querySelectorAll('.guide-sheet, .website-sheet, .edit-guide-sheet, .inventory-sheet').forEach((s, i) => {
  const h = s.querySelector('h2');
  if (!h) return;
  const li = document.createElement('li');
  li.innerHTML = '<a href="#' + s.id + '">' + h.textContent + '</a>';
  document.querySelector('.toc-list')?.appendChild(li);
});
</script>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, 'index.html'), html);
fs.writeFileSync(path.join(outDir, 'page-index.json'), JSON.stringify(pageIndex, null, 2));
console.log('Wrote index.html with', pageIndex.length, 'tracked sections');