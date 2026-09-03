// A combinatorial pool of review templates, assembled from four independent
// parts (opener + detail + closer, with an optional human "quirk" prefix on
// the detail) so the output reads like a real person's review rather than a
// mad-libs sentence:
//
// - SEO: every opener and most closers mention {business} and {location}
//   together, the strongest local-SEO signal a Google review can carry.
// - AEO/GEO (answer/generative-engine optimization): several details and
//   closers are phrased as a direct answer to an implicit query — "is it
//   worth it", "what's the best X in {location}" — the form AI answer
//   engines and generative search tend to lift verbatim into summaries.
// - Human voice: contractions, sentence fragments, and casual lead-ins
//   ("honestly,", "not gonna lie,") are mixed in on a minority of renders so
//   not every review reads like it was written by the same person, and the
//   pool avoids sounding like an obviously AI-generated template.
//
// 20 openers x 15 details x 15 closers x 8 quirks = 36,000 unique renders.

const OPENERS: string[] = [
  "Went to {business} in {location} last week and honestly, it exceeded expectations.",
  "I've been meaning to write this for a while — {business} in {location} is genuinely worth it.",
  "If you're in {location} and looking for a solid option, {business} should be on your list.",
  "Not gonna lie, I walked into {business} in {location} with low expectations. Glad I was wrong.",
  "{business} has quickly become my go-to spot in {location}.",
  "First time at {business} in {location}, and it won't be the last.",
  "A friend recommended {business} in {location}, and now I'm doing the same for anyone reading this.",
  "Been living in {location} for years, and {business} is one of the better finds.",
  "Stopped by {business} in {location} on a whim and ended up really impressed.",
  "So {business} in {location}... yeah, it lives up to the hype.",
  "I don't leave reviews often, but {business} in {location} earned this one.",
  "{business} in {location} — solid choice if you're deciding where to go.",
  "Had a great experience at {business}, right here in {location}.",
  "If anyone in {location} asks me for a recommendation, {business} is the first name that comes up.",
  "Honestly surprised more people in {location} don't talk about {business} more.",
  "Came across {business} in {location} through a quick search, and I'm glad I clicked.",
  "{business} in {location} is proof that small details make a big difference.",
  "Was skeptical at first, but {business} in {location} won me over pretty quickly.",
  "Second visit to {business} in {location}, and it was just as good as the first.",
  "Can confidently say {business} is one of the best in {location} right now.",
];

const DETAILS: string[] = [
  "The staff were friendly without being overbearing, and everything felt well taken care of.",
  "What stood out most was the attention to detail — nothing felt rushed or half-done.",
  "Prices are fair for what you get, which isn't always the case these days.",
  "Everything was clean, organized, and clearly well managed.",
  "The service was quick, but it never felt like they were cutting corners.",
  "Everyone I dealt with seemed genuinely happy to help, which says a lot.",
  "Quality-wise, it's up there with the best I've experienced in a while.",
  "They clearly care about getting the small things right, not just the big stuff.",
  "It's the kind of place where you can tell the team actually enjoys the work.",
  "No long waits, no confusion — just a smooth experience start to finish.",
  "If you're wondering whether it's worth the visit, it is.",
  "The whole experience felt personal, not like just another transaction.",
  "I appreciated that nothing felt upsold or forced, just genuine good service.",
  "It's clear a lot of thought goes into how things are run behind the scenes.",
  "Consistency seems to be their thing — just as good as I remembered from before.",
];

const CLOSERS: string[] = [
  "Would recommend to anyone in {location} without hesitation.",
  "Definitely coming back, and I'd tell friends in {location} to check it out too.",
  "Two thumbs up from me.",
  "No complaints here, solid experience all around.",
  "If you're near {location}, it's worth the stop.",
  "Already planning my next visit.",
  "Would give more than five stars if I could.",
  "Simple as that: good experience, would repeat.",
  "This is exactly the kind of place {location} needs more of.",
  "Not much else to add, just go see for yourself.",
  "Give them a shot, you won't regret it.",
  "That's my honest take, for what it's worth.",
  "Solid pick if you're deciding where to go in {location}.",
  "Will be recommending {business} to everyone who asks.",
  "Overall, a genuinely good experience from start to finish.",
];

// Light human touches mixed onto a minority of details. Empty entries
// (repeated) keep most reviews reading plainly so the quirk stays a seasoning,
// not a gimmick — real people don't all talk the same way, but most of the
// time they also don't add a verbal tic to every sentence.
const QUIRKS: string[] = [
  "",
  "",
  "",
  "Honestly, ",
  "Not gonna lie, ",
  "To be fair, ",
  "Ngl, ",
  "If I'm being honest, ",
];

export const TOTAL_REVIEW_TEMPLATES =
  OPENERS.length * DETAILS.length * CLOSERS.length * QUIRKS.length;

function fillPlaceholders(text: string, business: string, location: string): string {
  return text.replaceAll("{business}", business).replaceAll("{location}", location);
}

function withQuirk(quirk: string, sentence: string): string {
  if (!quirk) return sentence;
  const lowered = sentence.charAt(0).toLowerCase() + sentence.slice(1);
  return `${quirk}${lowered}`;
}

export function renderReviewTemplate(
  index: number,
  businessName: string,
  location: string
): string {
  const total = TOTAL_REVIEW_TEMPLATES;
  const normalized = ((index % total) + total) % total;

  const openerIndex = normalized % OPENERS.length;
  const detailIndex = Math.floor(normalized / OPENERS.length) % DETAILS.length;
  const closerIndex =
    Math.floor(normalized / (OPENERS.length * DETAILS.length)) % CLOSERS.length;
  const quirkIndex =
    Math.floor(normalized / (OPENERS.length * DETAILS.length * CLOSERS.length)) % QUIRKS.length;

  const business = businessName.trim() || "this business";
  const place = location.trim() || "the area";

  const opener = fillPlaceholders(OPENERS[openerIndex], business, place);
  const detail = withQuirk(QUIRKS[quirkIndex], DETAILS[detailIndex]);
  const closer = fillPlaceholders(CLOSERS[closerIndex], business, place);

  return `${opener} ${detail} ${closer}`;
}
