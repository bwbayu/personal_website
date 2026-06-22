// Estimated reading time in whole minutes at ~200 words/min, floored at 1 so an
// empty or very short post still reads as "1 min".
export const readingTime = (content: string): number => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};
