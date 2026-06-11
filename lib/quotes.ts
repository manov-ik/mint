export const QUOTES = [
  "Discipline is the bridge between goals and accomplishment.",
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
  "The pain of discipline is far less than the pain of regret.",
  "Mastery is not a perfection, it is a journey of continuous improvement.",
  "Your future is created by what you do today, not tomorrow.",
  "Success is nothing more than a few simple disciplines, practiced every day.",
  "Discipline is choosing between what you want now and what you want most.",
  "He who has a why to live can bear almost any how.",
  "Amateurs wait for inspiration. Professionals get to work.",
  "The secret of your future is hidden in your daily routine.",
];

export function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}
