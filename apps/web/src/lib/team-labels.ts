export function isLiverpoolTeamName(name: string) {
  return name.trim().toLowerCase().includes('liverpool');
}

/** Short label for narrow winner buttons on mobile. */
export function compactTeamLabel(name: string) {
  if (isLiverpoolTeamName(name)) {
    return 'Liverpool';
  }
  const trimmed = name.trim();
  if (trimmed.length <= 12) {
    return trimmed;
  }
  const firstWord = trimmed.split(/\s+/)[0] ?? trimmed;
  return firstWord.length <= 12 ? firstWord : `${firstWord.slice(0, 11)}…`;
}

export function teamCrestLabel(name: string) {
  if (isLiverpoolTeamName(name)) {
    return 'LFC';
  }
  const letters = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return letters.slice(0, 3) || '—';
}
