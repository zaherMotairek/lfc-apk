#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'docs/committee-presentation');
const shots = path.join(outDir, 'shots');

function exists(file) {
  return fs.existsSync(path.join(shots, file));
}

function img(file, alt) {
  if (!exists(file)) {
    return `<div class="note">Screenshot pending: <code>${file}</code></div>`;
  }
  return `<img src="shots/${file}" alt="${alt}" loading="lazy" />`;
}

function phone(file, num, title, see, why) {
  return `
  <figure class="phone-block">
    <div class="phone">${img(file, title)}</div>
    <figcaption class="caption"><strong>Fig ${num}.</strong> ${title}<br/>
    <span class="shot-line"><em>What visitors see:</em> ${see}</span><br/>
    <span class="shot-line"><em>Why it helps:</em> ${why}</span></figcaption>
  </figure>`;
}

function phonesRow(items) {
  return `<div class="phones">${items.join('')}</div>`;
}

function desktop(file, title, extra = '') {
  return `
  <figure>
    ${img(file, title)}
    <figcaption class="caption"><strong>${title}</strong>${extra ? `<br/>${extra}` : ''}</figcaption>
  </figure>`;
}

const dateLabel = '14 November 2026';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>RedLeb Hub — Committee presentation</title>
  <link rel="stylesheet" href="print.css" />
</head>
<body>

<section class="sheet cover" id="page-1">
  <p class="lead">OLSC Lebanon · Internal committee pack</p>
  <h1>RedLeb Hub — the official home of OLSC Lebanon</h1>
  <p class="lead" style="font-size:14pt;">Committee presentation</p>
  <p>${dateLabel}</p>
  <span class="badge">Demo version — all people, phone numbers and e-mails in this PDF are fictional</span>
  <div class="footer">RedLeb Hub – OLSC Lebanon · Page 1</div>
</section>

<section class="sheet" id="page-2">
  <h2>In a nutshell</h2>
  <p>RedLeb Hub is the website and phone-friendly app for Liverpool supporters in Lebanon. You can add it to your home screen like an app — no app store needed.</p>
  <p><strong>What it's for:</strong></p>
  <ul>
    <li>Bringing supporters together in one digital home</li>
    <li>Making it easy to discover events and news</li>
    <li>Letting members use a digital card, predictions, and community tools</li>
    <li>Letting the committee run content, members, and events <em>without calling a developer every week</em></li>
  </ul>
  <p class="note"><strong>Important:</strong> RedLeb Hub does <em>not</em> replace official OLSC membership. The official member number still comes from the committee. The platform supports members the committee has already approved.</p>
  <div class="footer">RedLeb Hub – OLSC Lebanon · Page 2</div>
</section>

<section class="sheet" id="page-3">
  <h2>Three spaces</h2>
  <div class="grid-3">
    <div class="space-card"><strong>Visitors</strong>Discover the club, read news, browse events, apply for membership.</div>
    <div class="space-card"><strong>Members</strong>Digital card with QR, Match Hub predictions, leaderboard, community feed.</div>
    <div class="space-card"><strong>Committee / Admin</strong>Approve applications, manage members, events, news, newsletter, texts &amp; branding.</div>
  </div>
  <p>Everyone uses the same site address. After you log in, you see the area that matches your role.</p>
  <div class="footer">RedLeb Hub – OLSC Lebanon · Page 3</div>
</section>

<section class="sheet" id="toc">
  <h2>Contents</h2>
  <ol class="toc">
    <li><a href="#page-1">Cover</a><span>1</span></li>
    <li><a href="#page-2">In a nutshell</a><span>2</span></li>
    <li><a href="#page-3">Three spaces</a><span>3</span></li>
    <li><a href="#page-4">For visitors — home &amp; story</a><span>4</span></li>
    <li><a href="#page-5">For visitors — news &amp; media</a><span>5</span></li>
    <li><a href="#page-6">For visitors — events &amp; guests</a><span>6</span></li>
    <li><a href="#page-7">Becoming a member</a><span>7</span></li>
    <li><a href="#page-8">Becoming a member (admin view)</a><span>8</span></li>
    <li><a href="#page-9">Member area — home &amp; card</a><span>9</span></li>
    <li><a href="#page-10">Member area — Match Hub</a><span>10</span></li>
    <li><a href="#page-11">Member area — community &amp; profile</a><span>11</span></li>
    <li><a href="#page-12">Committee — dashboard &amp; applications</a><span>12</span></li>
    <li><a href="#page-13">Committee — members &amp; events</a><span>13</span></li>
    <li><a href="#page-14">Committee — content tools</a><span>14</span></li>
    <li><a href="#page-15">Committee — change without a developer</a><span>15</span></li>
    <li><a href="#page-16">Change without a developer (continued)</a><span>16</span></li>
    <li><a href="#page-17">Safety &amp; privacy</a><span>17</span></li>
    <li><a href="#page-18">Where we are today</a><span>18</span></li>
    <li><a href="#page-19">What we suggest next</a><span>19</span></li>
    <li><a href="#page-20">What we need from the committee</a><span>20</span></li>
  </ol>
  <div class="footer">RedLeb Hub – OLSC Lebanon · Contents</div>
</section>

<section class="sheet" id="page-4">
  <h2>For visitors — home &amp; story</h2>
  ${phonesRow([
    phone('01-home-mobile-top.png', '4a', 'Home (top)', 'Welcome message, latest news, and paths to events and membership.', 'First impression — feels official, warm, and easy to scroll.'),
    phone('02-home-mobile-scrolled.png', '4b', 'Home (scrolled)', 'More sections as supporters explore.', 'Shows depth without overwhelming newcomers.'),
  ])}
  ${phonesRow([
    phone('03-about.png', '4c', 'About', 'Club story and values.', 'Builds trust for people who do not know OLSC Lebanon yet.'),
    phone('04-committee.png', '4d', 'Committee', 'Who runs the branch.', 'Puts faces and roles on the people behind the club.'),
  ])}
  <div class="footer">RedLeb Hub – OLSC Lebanon · Page 4</div>
</section>

<section class="sheet" id="page-5">
  <h2>For visitors — news &amp; media</h2>
  ${phonesRow([
    phone('07-news-list.png', '5a', 'News', 'Latest articles.', 'Keeps the site alive between matchdays.'),
    phone('08-news-detail.png', '5b', 'News article', 'Full story view.', 'Room for match reports and announcements.'),
  ])}
  ${phonesRow([
    phone('09-newsletter.png', '5c', 'Newsletter archive', 'Monthly PDF issues when published.', 'Long-form updates for members who prefer e-mail.'),
    phone('10-gallery.png', '5d', 'Gallery', 'Photo albums from events.', 'Celebrates the community — demo photos only in this pack.'),
  ])}
  <div class="footer">RedLeb Hub – OLSC Lebanon · Page 5</div>
</section>

<section class="sheet" id="page-6">
  <h2>For visitors — events &amp; guests</h2>
  ${phonesRow([
    phone('05-events-list.png', '6a', 'Events list', 'Upcoming watch parties and gatherings.', 'One place to see what is on.'),
    phone('06-event-detail-guests.png', '6b', 'Event sign-up (+ guests)', 'Members can register and bring +1 or +2 guests when enabled.', 'Helps the committee plan capacity — guest limits are configurable.'),
  ])}
  ${phone('11-membership.png', '6c', 'Membership info', 'Explains official membership vs the digital platform.', 'Sets expectations before someone applies.')}
  <div class="footer">RedLeb Hub – OLSC Lebanon · Page 6</div>
</section>

<section class="sheet" id="page-7">
  <h2>Becoming a member</h2>
  <ol class="steps">
    <li>Read the Membership page and choose the application form.</li>
    <li>Fill in the form (demo data only in screenshots).</li>
    <li>The committee reviews applications in the admin area.</li>
    <li>Approved members receive an invitation link, set a password, and log in.</li>
  </ol>
  ${phonesRow([
    phone('12-membership-apply.png', '7a', 'Application form', 'Collects contact details and ALLRED SUPPORT ID when relevant.', 'Structured data instead of scattered WhatsApp messages.'),
    phone('13-login.png', '7b', 'Sign in', 'Returning members and committee admins log in here.', 'Same front door for everyone — permissions decide what you see next.'),
  ])}
  <p class="note">Activation after invite uses a secure invitation link (not shown here). The committee always decides who becomes a member.</p>
  <div class="footer">RedLeb Hub – OLSC Lebanon · Page 7</div>
</section>

<section class="sheet" id="page-8">
  <h2>Becoming a member — committee view</h2>
  ${desktop('24-admin-applications.png', 'Membership applications', 'Queue, status, and quick actions for fictional demo applicants.')}
  <p>You stay in control: approve, reject, or ask for payment confirmation before anyone gets platform access.</p>
  <div class="footer">RedLeb Hub – OLSC Lebanon · Page 8</div>
</section>

<section class="sheet" id="page-9">
  <h2>Member area — home &amp; card</h2>
  ${phonesRow([
    phone('14-member-home.png', '9a', 'Member home', 'Shortcuts to card, matches, and community.', 'Feels like a supporters app, not a blank login screen.'),
    phone('15-membership-card.png', '9b', 'Digital membership card + QR', 'Check-in at events; optional uploaded card photo.', 'Replaces digging for a paper card — committee can verify at the door.'),
  ])}
  <p class="note">If the OLSC logo file is not uploaded yet, the site shows a temporary logo until you add one under Settings → Branding.</p>
  <div class="footer">RedLeb Hub – OLSC Lebanon · Page 9</div>
</section>

<section class="sheet" id="page-10">
  <h2>Member area — Match Hub</h2>
  ${phonesRow([
    phone('16-matches-list.png', '10a', 'Upcoming matches', 'Liverpool fixtures open for predictions.', 'Engagement without a separate app.'),
    phone('17-match-hub.png', '10b', 'Match Hub / predictions', 'Score and scorer picks before kick-off.', 'Season points only — no coins or XP shop in the member experience.'),
  ])}
  ${phone('18-leaderboard.png', '10c', 'Leaderboard', 'Rankings by prediction points.', 'Friendly competition — privacy options exist for members who opt out of the directory.')}
  <div class="footer">RedLeb Hub – OLSC Lebanon · Page 10</div>
</section>

<section class="sheet" id="page-11">
  <h2>Member area — community &amp; profile</h2>
  ${phonesRow([
    phone('19-community.png', '11a', 'Community feed', 'News, events, and milestones in one feed.', 'Keeps members coming back between matches.'),
    phone('20-notifications.png', '11b', 'Notifications', 'In-app alerts when enabled.', 'Pairs with optional push notifications when you configure VAPID keys.'),
  ])}
  ${phonesRow([
    phone('21-profile.png', '11c', 'Profile', 'Name, contact details, OLSC ID, <strong>ALLRED SUPPORT ID</strong>.', 'Members maintain their own details; committee sees roster tools in admin.'),
    phone('22-hall-of-fame.png', '11d', 'Hall of Fame', 'Top predictors and achievements when data exists.', 'Celebrates regular contributors — may look quiet until more matches are played.'),
  ])}
  <div class="footer">RedLeb Hub – OLSC Lebanon · Page 11</div>
</section>

<section class="sheet" id="page-12">
  <h2>Committee — dashboard &amp; applications</h2>
  ${desktop('23-admin-dashboard.png', 'Admin dashboard', 'Quick links and overview for day-to-day work.')}
  <p>Role-based access is built in: only people with the right permissions see sensitive admin screens (for example user management or audit log).</p>
  <div class="footer">RedLeb Hub – OLSC Lebanon · Page 12</div>
</section>

<section class="sheet" id="page-13">
  <h2>Committee — members &amp; events</h2>
  <div class="pair">
    <div>${desktop('25-admin-members.png', 'Members list', 'Search, ALLRED SUPPORT ID column, invitations, and roster import.')}</div>
    <div>${desktop('26-admin-member-activity.png', 'Members & activity', 'Search, ALLRED SUPPORT ID, last seen — open Edit on a member for login and prediction activity (same screen family as the list).')}</div>
  </div>
  ${desktop('27-admin-events.png', 'Events admin', 'Registrations, guest counts, and exports for planning.')}
  <div class="footer">RedLeb Hub – OLSC Lebanon · Page 13</div>
</section>

<section class="sheet" id="page-14">
  <h2>Committee — content tools</h2>
  ${desktop('28-admin-matches.png', 'Matches', 'Create fixtures, close predictions, enter results.')}
  <div class="pair">
    <div>${desktop('29-admin-news.png', 'News', 'Draft and publish articles.')}</div>
    <div>${desktop('30-admin-newsletter.png', 'Newsletter', 'Monthly issues and optional member e-mail sends.')}</div>
  </div>
  ${desktop('31-admin-cms.png', 'CMS pages', 'Structured sections for About, Membership, and other pages.')}
  <div class="footer">RedLeb Hub – OLSC Lebanon · Page 14</div>
</section>

<section class="sheet" id="page-15">
  <h2>The committee can change almost anything</h2>
  <p>No developer needed for everyday wording and branding:</p>
  <ul>
    <li><strong>Edit mode on the live page</strong> (for admins with content permission — same toolbar as public pages when logged in)</li>
    <li><strong>Texts &amp; Labels</strong> — search, edit, panic-restore to defaults</li>
    <li><strong>Settings / Branding</strong> — site name, colours, logo upload, navigation order</li>
    <li><strong>Design</strong> page — quick reference to where visual settings live</li>
  </ul>
  ${desktop('31b-admin-cms-about-preview.png', 'CMS pages (admin)', 'Pick a page, edit sections, save — no code.')}
  ${phone('32-admin-inline-edit-mobile.png', '15a', 'Texts on mobile', 'Search and edit button labels from a phone.', 'Day-to-day copy changes without a laptop.')}
  <div class="footer">RedLeb Hub – OLSC Lebanon · Page 15</div>
</section>

<section class="sheet" id="page-16">
  <h2>Texts, branding &amp; undo</h2>
  <div class="pair">
    <div>${desktop('33-admin-texts.png', 'Texts &amp; Labels', 'Hundreds of keys in English; Arabic presets can be imported for review.')}</div>
    <div>${desktop('34-admin-settings.png', 'Settings &amp; Branding', 'Logo, colours, feature flags, navigation.')}</div>
  </div>
  ${desktop('35-admin-design.png', 'Design reference', 'Points admins to the right settings and text screens.')}
  <p>Changes to CMS content and text overrides keep revision history; panic restore clears custom text per language when you need a clean slate.</p>
  <motion class="note">Audit log (<code>/admin/audit</code>) records many admin actions — useful if you need to see who changed what.</motion>
  <div class="footer">RedLeb Hub – OLSC Lebanon · Page 16</div>
</section>

<section class="sheet" id="page-17">
  <h2>Safety &amp; privacy (what is in place today)</h2>
  <ul>
    <li><strong>Passwords</strong> are stored hashed (bcrypt) — admins never see a member's password.</li>
    <li><strong>Log in</strong> uses secure tokens (JWT access + refresh); sessions can be ended on the server.</li>
    <li><strong>Invitations</strong> use time-limited links for new accounts instead of sharing passwords by hand.</li>
    <li><strong>Rate limits</strong> on sensitive routes reduce brute-force and spam (including log in).</li>
    <li><strong>Permissions &amp; roles</strong> control who can manage users, content, matches, and settings.</li>
    <li><strong>Audit log</strong> for many admin actions; moderation tools for community content where enabled.</li>
    <li><strong>Data minimisation</strong> — we only ask for fields the committee needs (application form, profile, roster import).</li>
    <li>See <code>docs/PRIVACY_NOTES.md</code> for retention and Lebanon-specific consent copy still to sign off with counsel.</li>
  </ul>
  <p>Production requires strong secrets (<code>JWT_*</code>), HTTPS, and no default seed password on a live database.</p>
  <div class="footer">RedLeb Hub – OLSC Lebanon · Page 17</div>
</section>

<section class="sheet" id="page-18">
  <h2>Where we are today</h2>
  <p>Plain-language summary from our gap tracker (13 Nov 2026):</p>
  <table class="status">
    <tr><th>Area</th><th>Status</th><th>Notes</th></tr>
    <tr><td>Public site + member app</td><td class="tag-ready">Ready</td><td>Core pages, PWA shell, EN + Arabic toggle</td></tr>
    <tr><td>Editable texts &amp; nav</td><td class="tag-ready">Ready</td><td>~100 registry keys; committee Arabic review still human</td></tr>
    <tr><td>Events + guests (+1/+2)</td><td class="tag-ready">Ready</td><td>Registration, waitlist, QR check-in</td></tr>
    <tr><td>Match Hub / leaderboard</td><td class="tag-ready">Ready</td><td>Prediction points; live spectacle off by default</td></tr>
    <tr><td>Newsletter workflow</td><td class="tag-progress">In progress</td><td>Scheduling exists; SMTP and process on you</td></tr>
    <tr><td>Staging / production deploy</td><td class="tag-progress">In progress</td><td>CI green; HTTPS + secrets + UAT remaining</td></tr>
    <tr><td>Drag-and-drop page builder</td><td class="tag-later">Later</td><td>CMS sections today, not full block editor</td></tr>
    <tr><td>Full Arabic copy sign-off</td><td class="tag-progress">In progress</td><td>Presets exist; committee review needed</td></tr>
  </table>
  <div class="footer">RedLeb Hub – OLSC Lebanon · Page 18</div>
</section>

<section class="sheet" id="page-19">
  <h2>What we suggest next</h2>
  <ul>
    <li>Arabic + English polish with a native reviewer</li>
    <li>Member perks with partners (shops scan the QR for offers)</li>
    <li>Easy WhatsApp sharing (invitation cards, event links)</li>
    <li>Photo wall and simple polls after events</li>
    <li>Friendly automatic messages (welcome, membership anniversary)</li>
    <li>Monday dashboard + monthly PDF report e-mailed to the committee</li>
  </ul>
  <p>YNWA — we'll keep the platform practical before we pile on gimmicks.</p>
  <div class="footer">RedLeb Hub – OLSC Lebanon · Page 19</div>
</section>

<section class="sheet" id="page-20">
  <h2>What we need from the committee</h2>
  <ul>
    <li>Approval of the <strong>RedLeb Hub</strong> name and overall design</li>
    <li>OLSC logo file + permission to use it on site and card</li>
    <li>Official texts (About, membership rules)</li>
    <li>Official member roster (Excel / CSV) for import</li>
    <li>Who gets which admin role (content, events, matches, super admin)</li>
    <li>Sending e-mail address and domain name for production</li>
    <li>Target launch window</li>
    <li>Someone to review Arabic translations</li>
  </ul>
  <p><strong>Next step:</strong> a small pilot with a handful of trusted members on staging, then widen when you are happy.</p>
  <p class="lead">Thank you for walking through this with us.</p>
  <div class="footer">RedLeb Hub – OLSC Lebanon · Page 20</div>
</section>

</body>
</html>`;

fs.mkdirSync(outDir, { recursive: true });
const fixed = html.replace('<motion class="note">', '<p class="note">').replace('</motion>', '</p>');
fs.writeFileSync(path.join(outDir, 'index.html'), fixed);
console.log('Wrote docs/committee-presentation/index.html');