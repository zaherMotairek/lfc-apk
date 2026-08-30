export type NewsletterPhoto = {
  url: string;
  caption: string;
};

export type NewsletterTableRow = {
  pos: string;
  club: string;
  pts: string;
};

export type NewsletterNewsBlock = {
  id: string;
  kicker: string;
  title: string;
  body: string;
  quote: string;
  quoteAuthor: string;
  photos: NewsletterPhoto[];
};

export type NewsletterResult = {
  result: string;
  label: string;
};

export type NewsletterFixture = {
  date: string;
  opponent: string;
};

export type NewsletterData = {
  issueNumber: number;
  monthLabel: string;
  arabicLine: string;
  chairperson: {
    kicker: string;
    title: string;
    greeting: string;
    body: string;
    name: string;
    role: string;
  };
  seasonReview: {
    enabled: boolean;
    kicker: string;
    title: string;
    body: string;
    togetherTitle: string;
    togetherBody: string;
    tableRows: NewsletterTableRow[];
    photos: NewsletterPhoto[];
  };
  clubNews: NewsletterNewsBlock[];
  onThePitch: {
    enabled: boolean;
    kicker: string;
    title: string;
    body: string;
    results: NewsletterResult[];
    fixturesKicker: string;
    fixturesBody: string;
    fixtures: NewsletterFixture[];
    getInvolved: string;
    membership: string;
  };
  memorial: {
    enabled: boolean;
    kicker: string;
    name: string;
    dates: string;
  };
};

export function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyPhoto(): NewsletterPhoto {
  return { url: '', caption: '' };
}

export function createEmptyNewsletter(issueNumber = 2): NewsletterData {
  const monthLabel = new Date()
    .toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    .toUpperCase();

  return {
    issueNumber,
    monthLabel,
    arabicLine: 'الرابطة الرسمية لمشجعي ليفربول في لبنان',
    chairperson: {
      kicker: 'FROM THE COMMITTEE',
      title: 'A Word From Our Chairperson',
      greeting: 'Reds,',
      body: '',
      name: 'Mohammad Abdallah',
      role: 'Chairperson, OLSC Lebanon',
    },
    seasonReview: {
      enabled: true,
      kicker: 'SEASON REVIEW',
      title: '',
      body: '',
      togetherTitle: 'OUR SEASON, TOGETHER',
      togetherBody: '',
      tableRows: [
        { pos: '1', club: '', pts: '' },
        { pos: '2', club: '', pts: '' },
        { pos: '3', club: '', pts: '' },
        { pos: '4', club: '', pts: '' },
        { pos: '5', club: 'Liverpool', pts: '' },
      ],
      photos: [emptyPhoto(), emptyPhoto(), emptyPhoto()],
    },
    clubNews: [
      {
        id: newId(),
        kicker: 'CLUB NEWS',
        title: '',
        body: '',
        quote: '',
        quoteAuthor: '',
        photos: [emptyPhoto()],
      },
    ],
    onThePitch: {
      enabled: true,
      kicker: 'ON THE PITCH',
      title: 'Pre-Season & What\'s Next',
      body: '',
      results: [
        { result: '', label: '' },
        { result: '', label: '' },
        { result: '', label: '' },
      ],
      fixturesKicker: 'PREMIER LEAGUE RETURNS',
      fixturesBody: '',
      fixtures: [
        { date: '', opponent: '' },
        { date: '', opponent: '' },
      ],
      getInvolved:
        'JOIN US Follow OLSC Lebanon for match screenings and events. Got a photo from a gathering, or something you want featured next issue? Send it to the committee.',
      membership:
        'MEMBERSHIP Everyone is welcome at OLSC Lebanon gatherings and watch parties, member or not. Becoming an official member goes further than that though, supporting the branch directly and unlocking extras throughout the season.',
    },
    memorial: {
      enabled: false,
      kicker: 'IN MEMORY OF',
      name: '',
      dates: '',
    },
  };
}
