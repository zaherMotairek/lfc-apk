/** Liverpool FC first-team squad — 2025/26 season (OLSC prediction dropdown). */
export type LiverpoolSquadPlayer = {
  number: number;
  name: string;
};

export const LIVERPOOL_SQUAD_2025_26: LiverpoolSquadPlayer[] = [
  { number: 1, name: 'Alisson Becker' },
  { number: 25, name: 'Giorgi Mamardashvili' },
  { number: 28, name: 'Freddie Woodman' },
  { number: 2, name: 'Joe Gomez' },
  { number: 4, name: 'Virgil van Dijk' },
  { number: 5, name: 'Jeremy Jacquet' },
  { number: 6, name: 'Milos Kerkez' },
  { number: 12, name: 'Conor Bradley' },
  { number: 15, name: 'Giovanni Leoni' },
  { number: 21, name: 'Kostas Tsimikas' },
  { number: 30, name: 'Jeremie Frimpong' },
  { number: 33, name: 'Ronald Araujo' },
  { number: 47, name: 'Calvin Ramsay' },
  { number: 3, name: 'Wataru Endo' },
  { number: 7, name: 'Florian Wirtz' },
  { number: 8, name: 'Dominik Szoboszlai' },
  { number: 10, name: 'Alexis Mac Allister' },
  { number: 17, name: 'Curtis Jones' },
  { number: 19, name: 'Harvey Elliott' },
  { number: 38, name: 'Ryan Gravenberch' },
  { number: 42, name: 'Trey Nyoni' },
  { number: 43, name: 'Stefan Bajcetic' },
  { number: 53, name: 'James McConnel' },
  { number: 9, name: 'Alexander Isak' },
  { number: 14, name: 'Federico Chiesa' },
  { number: 18, name: 'Cody Gakpo' },
  { number: 22, name: 'Hugo Ekitike' },
  { number: 23, name: 'Victor Munoz' },
  { number: 73, name: 'Rio Ngumoha' },
];

export type LiverpoolPlayer = LiverpoolSquadPlayer['name'];

export function formatLiverpoolPlayerOption(player: LiverpoolSquadPlayer): string {
  return `${player.number} — ${player.name}`;
}

export function isLiverpoolTeamName(name: string): boolean {
  return name.trim().toLowerCase().includes('liverpool');
}

export function isLiverpoolFixture(homeTeamName: string, awayTeamName: string): boolean {
  return isLiverpoolTeamName(homeTeamName) || isLiverpoolTeamName(awayTeamName);
}

export const PREDICTION_SCORING = {
  exactScorePoints: 3,
  winnerPoints: 1,
  liverpoolMultiplier: 2,
  firstGoalscorerPoints: 1,
  cleanSheetPoints: 1,
} as const;
