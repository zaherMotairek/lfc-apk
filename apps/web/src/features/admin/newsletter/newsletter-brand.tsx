/** Spaced capitals like the Canva PDF: F R O M T H E C O M M I T T E E */
export function spaceLetters(text: string) {
  return text
    .toUpperCase()
    .split('')
    .filter((ch) => ch.trim())
    .join(' ');
}
