import type { CommitteeMember } from './cms-types';

export const DEFAULT_COMMITTEE_INTRO =
  'OLSC Lebanon is led by a volunteer committee of dedicated Liverpool supporters. They organize watch parties, manage official membership, and build the community that makes the Kop spirit alive in Lebanon.';

export const DEFAULT_COMMITTEE_MEMBERS: CommitteeMember[] = [
  {
    name: 'Ahmad Khalil',
    role: 'President',
    initials: 'AK',
    bio: 'Leads OLSC Lebanon with a focus on official LFC / OLSC standards, community growth, and nationwide supporter engagement.',
    email: 'president@olsclebanon.com',
  },
  {
    name: 'Sara Mansour',
    role: 'Vice President',
    initials: 'SM',
    bio: 'Supports committee operations, member relations, and partnerships with local venues for matchday experiences.',
    email: 'vicepresident@olsclebanon.com',
  },
  {
    name: 'Karim Haddad',
    role: 'Secretary',
    initials: 'KH',
    bio: 'Handles communications, meeting coordination, and official correspondence with members and partners.',
    email: 'secretary@olsclebanon.com',
  },
  {
    name: 'Nour El-Ali',
    role: 'Events Lead',
    initials: 'NE',
    bio: 'Plans watch parties, gatherings, and community events across Lebanon — bringing the Kop together on matchday.',
    email: 'events@olsclebanon.com',
  },
  {
    name: 'Omar Fares',
    role: 'Membership Lead',
    initials: 'OF',
    bio: 'Manages official membership enquiries, card verification, and onboarding for new OLSC Lebanon members.',
    email: 'membership@olsclebanon.com',
  },
  {
    name: 'Layla Gemayel',
    role: 'Digital & Kop Platform',
    initials: 'LG',
    bio: 'Oversees the Kop Platform — Match Hub, digital cards, community feed, and member digital experience.',
    email: 'digital@olsclebanon.com',
  },
];
