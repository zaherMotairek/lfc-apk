import { useEffect, useState, type ReactNode } from 'react';
import type { NewsletterData, NewsletterPhoto } from './newsletter-types';
import { spaceLetters } from './newsletter-brand';
import {
  loadNewsletterBackgrounds,
  preloadNewsletterBackgrounds,
  type NewsletterBackgrounds,
} from './newsletter-pdf-engine';

preloadNewsletterBackgrounds();

function Photos({ photos, columns = 3 }: { photos: NewsletterPhoto[]; columns?: number }) {
  const shown = photos.filter((p) => p.url || p.caption);
  if (!shown.length) return null;
  return (
    <div className={`rd-photos ${columns === 2 ? 'rd-photos-2' : ''}`}>
      {shown.map((photo, index) => (
        <figure key={`${photo.caption}-${index}`} className="rd-photo">
          {photo.url ? (
            <img src={photo.url} alt={photo.caption || 'Newsletter photo'} crossOrigin="anonymous" />
          ) : (
            <div className="rd-photo-empty">PHOTO</div>
          )}
          {photo.caption ? <figcaption className="rd-caption">{photo.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  );
}

function Footer({ page }: { page: number }) {
  return (
    <div className="rd-footer">
      <span>OLSC LEBANON · REDLEB DISPATCH</span>
      <span>PAGE {page}</span>
    </div>
  );
}

function InnerPageShell({
  bg,
  page,
  children,
}: {
  bg: string;
  page: number;
  children: ReactNode;
}) {
  return (
    <section className="rd-page">
      <img src={bg} alt="" className="rd-page-bg" />
      <div className="rd-content-mask" aria-hidden />
      <div className="rd-inner">{children}</div>
      <Footer page={page} />
    </section>
  );
}

function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function RedlebDispatch({ data }: { data: NewsletterData }) {
  const [backgrounds, setBackgrounds] = useState<NewsletterBackgrounds | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadNewsletterBackgrounds()
      .then((bg) => {
        if (active) setBackgrounds(bg);
      })
      .catch((err) => {
        if (active) {
          setLoadError(
            err instanceof Error ? err.message : 'Unable to load the official PDF template.',
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (loadError) {
    return (
      <div className="rd-root">
        <div className="rd-loading" style={{ color: '#c8102e' }}>
          Template error: {loadError}
          <br />
          <br />
          Check that /newsletter/issue01-reference.pdf is available.
        </div>
      </div>
    );
  }

  if (!backgrounds) {
    return (
      <div className="rd-root">
        <div className="rd-loading">Loading official RedLeb Dispatch template from PDF…</div>
      </div>
    );
  }

  let page = 1;
  const issueNum = String(data.issueNumber).padStart(2, '0');
  const coverIssue = spaceLetters(
    `OLSC LEBANON MEMBERS' NEWSLETTER · ISSUE ${issueNum} · ${data.monthLabel}`,
  );

  const pages: Array<{ key: string; node: ReactNode }> = [];

  pages.push({
    key: 'cover',
    node: (
      <section className="rd-page">
        <img src={backgrounds.cover} alt="" className="rd-page-bg" />
        <div className="rd-cover-patch" aria-hidden />
        <div className="rd-cover-dynamic">
          <div className="rd-cover-meta">{coverIssue}</div>
          <div className="rd-cover-ar">{data.arabicLine}</div>
        </div>
      </section>
    ),
  });

  page += 1;
  const chairPage = page;
  pages.push({
    key: 'chair',
    node: (
      <InnerPageShell bg={backgrounds.inner} page={chairPage}>
        <div className="rd-kicker">{spaceLetters(data.chairperson.kicker)}</div>
        <h1 className="rd-h1">{data.chairperson.title || 'A Word From Our Chairperson'}</h1>
        {data.chairperson.greeting ? (
          <div className="rd-greeting rd-body">{data.chairperson.greeting}</div>
        ) : null}
        <div className="rd-body">
          {paragraphs(data.chairperson.body).map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
        <div className="rd-sign">
          <div className="rd-sign-name">{data.chairperson.name}</div>
          <div className="rd-sign-role">{data.chairperson.role}</div>
        </div>
      </InnerPageShell>
    ),
  });

  if (data.seasonReview.enabled) {
    page += 1;
    const seasonPage = page;
    const tableRows = data.seasonReview.tableRows.filter((r) => r.club || r.pts);
    pages.push({
      key: 'season',
      node: (
        <InnerPageShell bg={backgrounds.inner} page={seasonPage}>
          <div className="rd-kicker">{spaceLetters(data.seasonReview.kicker)}</div>
          <h1 className="rd-h1">{data.seasonReview.title || 'Season Review'}</h1>
          <div className="rd-body">
            {paragraphs(data.seasonReview.body).map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
          {tableRows.length ? (
            <table className="rd-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Club</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr
                    key={`${row.pos}-${row.club}`}
                    className={row.club.toLowerCase().includes('liverpool') ? 'rd-lfc' : undefined}
                  >
                    <td>{row.pos}</td>
                    <td>{row.club}</td>
                    <td>{row.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {data.seasonReview.togetherTitle ? (
            <div className="rd-sub-kicker">{spaceLetters(data.seasonReview.togetherTitle)}</div>
          ) : null}
          <div className="rd-body">
            {paragraphs(data.seasonReview.togetherBody).map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
          <Photos photos={data.seasonReview.photos} />
        </InnerPageShell>
      ),
    });
  }

  data.clubNews.forEach((block, index) => {
    if (!block.title && !block.body && !block.photos.some((p) => p.url)) {
      return;
    }
    page += 1;
    const newsPage = page;
    pages.push({
      key: block.id,
      node: (
        <InnerPageShell bg={backgrounds.inner} page={newsPage}>
          <div className="rd-kicker">{spaceLetters(block.kicker || 'CLUB NEWS')}</div>
          <h1 className="rd-h1">{block.title || `Story ${index + 1}`}</h1>
          <div className="rd-body">
            {paragraphs(block.body).map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
          {block.quote ? (
            <blockquote className="rd-quote">
              <div className="rd-quote-mark">"</div>
              {block.quote}
              {block.quoteAuthor ? <div className="rd-quote-author">{block.quoteAuthor}</div> : null}
            </blockquote>
          ) : null}
          <Photos photos={block.photos} columns={2} />
        </InnerPageShell>
      ),
    });
  });

  if (data.onThePitch.enabled) {
    page += 1;
    const pitchPage = page;
    const results = data.onThePitch.results.filter((r) => r.result || r.label);
    const fixtures = data.onThePitch.fixtures.filter((f) => f.date || f.opponent);
    pages.push({
      key: 'pitch',
      node: (
        <InnerPageShell bg={backgrounds.inner} page={pitchPage}>
          <div className="rd-kicker">{spaceLetters(data.onThePitch.kicker)}</div>
          <h1 className="rd-h1">{data.onThePitch.title}</h1>
          <div className="rd-body">
            {paragraphs(data.onThePitch.body).map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
          {results.length ? (
            <div className="rd-results">
              {results.map((item) => (
                <div key={`${item.result}-${item.label}`} className="rd-result">
                  <div className="rd-result-score">{item.result}</div>
                  <div className="rd-result-label">{item.label}</div>
                </div>
              ))}
            </div>
          ) : null}
          <div className="rd-sub-kicker">{spaceLetters(data.onThePitch.fixturesKicker)}</div>
          <div className="rd-body">
            {paragraphs(data.onThePitch.fixturesBody).map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
          {fixtures.length ? (
            <div className="rd-fixtures">
              {fixtures.map((item) => (
                <div key={`${item.date}-${item.opponent}`} className="rd-fixture">
                  <div className="rd-fixture-date">{item.date}</div>
                  <div className="rd-fixture-opp">{item.opponent}</div>
                </div>
              ))}
            </div>
          ) : null}
          <div className="rd-body">
            {data.onThePitch.getInvolved ? <p>{data.onThePitch.getInvolved}</p> : null}
            {data.onThePitch.membership ? <p>{data.onThePitch.membership}</p> : null}
          </div>
        </InnerPageShell>
      ),
    });
  }

  if (data.memorial.enabled && data.memorial.name) {
    pages.push({
      key: 'memorial',
      node: (
        <section className="rd-page">
          <img src={backgrounds.memorial} alt="" className="rd-page-bg" />
          <div className="rd-memorial-mask" aria-hidden />
          <div className="rd-memorial-content rd-memorial">
            <div className="rd-kicker">{spaceLetters(data.memorial.kicker)}</div>
            <div className="rd-memorial-name">{data.memorial.name}</div>
            <div className="rd-memorial-dates">{data.memorial.dates}</div>
            <div className="rd-memorial-ynwa">{spaceLetters("YOU'LL NEVER WALK ALONE")}</div>
          </div>
        </section>
      ),
    });
  }

  return (
    <div className="rd-root" id="redleb-dispatch-print">
      {pages.map((item) => (
        <div key={item.key}>{item.node}</div>
      ))}
    </div>
  );
}
