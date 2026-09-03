// A combinatorial pool of SEO-friendly review templates. Each template mentions
// the business name and location (both good local-SEO signals on Google), a
// service theme, and a positive adjective. 20 structures x 10 adjectives x 5
// themes = 1000 unique renderable reviews per business.

const STRUCTURES: string[] = [
  "I had a truly {adj} experience at {business} in {location} — the {theme} exceeded my expectations.",
  "If you're looking for {adj} {theme} in {location}, {business} is the place to go.",
  "{business} in {location} impressed me with their {adj} {theme}. Highly recommend to anyone nearby.",
  "Five stars for {business}! Their {theme} is {adj}, and it's clear why they're a top choice in {location}.",
  "I've tried a few places in {location}, but {business} stands out for their {adj} {theme}.",
  "The {theme} at {business} was {adj} from start to finish. Best in {location}, hands down.",
  "As a local in {location}, I can say {business} offers some of the most {adj} {theme} around.",
  "{business} really knows how to deliver {adj} {theme}. Will definitely be back next time I'm in {location}.",
  "Honestly one of the best experiences I've had in {location} — {business}'s {theme} is {adj}.",
  "Anyone searching for great {theme} in {location} should check out {business}. It was {adj} in every way.",
  "I'm so glad I found {business} here in {location}. Their {theme} is genuinely {adj}.",
  "{business} sets the standard for {adj} {theme} in {location}. Couldn't be happier.",
  "Great {theme}, {a_adj} team, and a welcoming vibe — {business} is a gem in {location}.",
  "Every time I visit {business} in {location}, the {theme} is consistently {adj}.",
  "Thanks to {business} for the {adj} {theme}! Definitely the go-to spot in {location}.",
  "{business} exceeded my expectations with {adj} {theme}. Proud to recommend them to anyone in {location}.",
  "Living in {location}, I've tried a lot of options, but {business}'s {theme} is by far the most {adj}.",
  "What stood out most at {business} was the {adj} {theme}. A must-visit in {location}.",
  "I can't say enough good things about {business} in {location} — the {theme} was {adj} and the team was incredibly kind.",
  "{business} has become my favorite spot in {location} thanks to their {adj} {theme}.",
];

const ADJECTIVES: string[] = [
  "outstanding",
  "excellent",
  "fantastic",
  "wonderful",
  "impressive",
  "top-notch",
  "exceptional",
  "amazing",
  "superb",
  "remarkable",
];

const THEMES: string[] = [
  "customer service",
  "quality of work",
  "attention to detail",
  "level of professionalism",
  "overall experience",
];

export const TOTAL_REVIEW_TEMPLATES = STRUCTURES.length * ADJECTIVES.length * THEMES.length;

function withArticle(word: string): string {
  return /^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`;
}

export function renderReviewTemplate(
  index: number,
  businessName: string,
  location: string
): string {
  const total = TOTAL_REVIEW_TEMPLATES;
  const normalized = ((index % total) + total) % total;

  const structureIndex = normalized % STRUCTURES.length;
  const adjIndex = Math.floor(normalized / STRUCTURES.length) % ADJECTIVES.length;
  const themeIndex =
    Math.floor(normalized / (STRUCTURES.length * ADJECTIVES.length)) % THEMES.length;

  const business = businessName.trim() || "this business";
  const place = location.trim() || "the area";
  const adjective = ADJECTIVES[adjIndex];

  return STRUCTURES[structureIndex]
    .replaceAll("{business}", business)
    .replaceAll("{location}", place)
    .replaceAll("{theme}", THEMES[themeIndex])
    .replaceAll("{a_adj}", withArticle(adjective))
    .replaceAll("{adj}", adjective);
}
