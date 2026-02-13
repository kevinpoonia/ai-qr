import { NextResponse } from 'next/server';

const themes = [
    "customer service",
    "product quality",
    "speed of delivery",
    "user experience",
    "value for money",
    "professionalism",
    "problem-solving",
    "innovation",
    "reliability",
    "ease of use"
];

const adjectives = [
    "fantastic",
    "excellent",
    "superb",
    "outstanding",
    "impressive",
    "top-notch",
    "seamless",
    "efficient",
    "helpful",
    "reliable"
];

const structures = [
    "I had a {adj} experience with their {theme}. Highly recommend!",
    "The {theme} is absolutely {adj}. Best decision I made for my business.",
    "Really {adj} {theme}. They handled everything with great professionalism.",
    "If you're looking for {adj} {theme}, look no further. This team is the best.",
    "Five stars for the {theme}! Truly {adj} and very easy to work with.",
    "I was blown away by the {theme}. It's {adj} and has saved me so much time.",
    "Their approach to {theme} is {adj}. I appreciate the attention to detail.",
    "Great {theme} and even better support. Everything was {adj} from start to finish.",
    "I've tried others but their {theme} is {adj}. Definitely the market leader.",
    "Simple, {adj}, and effective {theme}. Exactly what I was searching for."
];

function generateReview() {
    const structure = structures[Math.floor(Math.random() * structures.length)];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const theme = themes[Math.floor(Math.random() * themes.length)];

    return structure
        .replace('{adj}', adj)
        .replace('{theme}', theme);
}

export async function GET() {
    const review = generateReview();

    return NextResponse.json({
        review,
        timestamp: new Date().toISOString()
    });
}
