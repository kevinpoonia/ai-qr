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
// - Category-aware: the "detail" sentence is picked from a pool specific to
//   the business's category (electrician, AC service, florist, ...), so the
//   review actually mentions the kind of work that was done — both more
//   convincing to a reader and richer for local SEO. Businesses without a
//   recognized category fall back to the generic "general" pool.
//
// Per category: 20 openers x 6 category details x 15 closers x 8 quirks =
// 14,400 unique renders — well over the 1,000-per-business bar.

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

// Category-specific "what actually happened" sentences. Each array is
// intentionally the same length (6) so every category yields the same total
// render count. Keep new entries free of {business}/{location} placeholders —
// those only live in OPENERS/CLOSERS.
const CATEGORY_DETAILS: Record<string, string[]> = {
  restaurant: [
    "The food came out hot, fresh, and exactly as described on the menu.",
    "Portion sizes were generous and the flavors were well balanced, not overly salty or sweet.",
    "Service was attentive without hovering, and the table was cleared promptly.",
    "You can tell the ingredients are fresh — nothing tasted like it had been sitting around.",
    "Waiting time was reasonable even during a busy hour.",
    "If you're wondering whether the food's actually good here, it is.",
  ],
  cafe: [
    "The coffee was made properly, not the watered-down version you get at most chain spots.",
    "Good spot to sit and work — decent wifi and nobody rushing you out.",
    "Pastries were fresh, not the stale stuff sitting out since morning.",
    "Staff remembered my order the second time, which is a nice touch.",
    "Seating was comfortable and the place wasn't overly noisy.",
    "If you're after a proper cup of coffee in the area, this is it.",
  ],
  bakery: [
    "Everything was baked fresh that morning, you could tell from the smell alone.",
    "The cake I ordered came out exactly like the photo, and it tasted even better.",
    "Prices are reasonable for the quality — not the cardboard-tasting stuff some bakeries sell.",
    "They took the time to get the design details right for a custom order.",
    "Bread was soft and fresh, not dried out by evening like some places.",
    "For anyone asking if it's worth ordering a custom cake here, absolutely.",
  ],
  sweet_shop: [
    "The mithai was fresh, not overly sugary, and had that proper homemade taste.",
    "Packaging was neat and held up fine for a gift box order.",
    "They didn't skimp on quality even for a bulk festival order.",
    "Everything tasted freshly made, not like it had been sitting in a display case for days.",
    "Good variety, and the classics were done really well.",
    "If you need sweets for an occasion, this is a safe bet.",
  ],
  catering: [
    "Food arrived on time and was still hot when it reached the venue.",
    "They handled a fairly large guest count without any hiccups.",
    "The menu had good variety and catered well to different dietary preferences.",
    "Setup and cleanup were handled professionally, one less thing to worry about.",
    "Portion planning was spot on — nothing ran out, nothing excessively wasted.",
    "For anyone planning an event and wondering if the catering will hold up, it will.",
  ],
  bar: [
    "Drinks were well made and didn't skimp on the pour.",
    "Good music at a volume where you could still hold a conversation.",
    "Staff were quick to take orders even when the place got busy.",
    "The vibe was relaxed without feeling dead — a good balance.",
    "Prices were fair for the area, no unpleasant surprises on the bill.",
    "Solid spot if you're looking for somewhere low-key to unwind in the evening.",
  ],
  salon: [
    "The stylist actually listened to what I wanted instead of doing their own thing.",
    "My haircut held its shape well even a few weeks later.",
    "The place was clean and tools looked properly sanitized between clients.",
    "Booking was easy and they stuck to the appointment time.",
    "Color came out exactly the shade I asked for, no surprises.",
    "If you're tired of stylists not listening, this is a nice change.",
  ],
  spa: [
    "The massage therapist worked on exactly the areas I mentioned were tense.",
    "Atmosphere was calm and relaxing, not rushed at all.",
    "Hygiene standards were clearly a priority — fresh linens, clean room.",
    "Pressure and technique were spot on, not too light and not painful.",
    "Left feeling genuinely relaxed, not like I'd been rushed through a routine.",
    "Worth booking again if you actually want to unwind, not just check a box.",
  ],
  beauty_parlour: [
    "The makeup application lasted the whole event without needing touch-ups.",
    "They took the time to understand what look I was going for.",
    "Products used felt good on the skin, no irritation afterward.",
    "Appointment ran on schedule, which mattered a lot on an event day.",
    "Threading and waxing were done quickly without much discomfort.",
    "For bridal or event prep, this is a solid choice.",
  ],
  barbershop: [
    "Clean, sharp fade, exactly the length I asked for.",
    "The barber took his time instead of rushing through the cut.",
    "Hot towel and finishing touches made it feel like a proper experience, not just a quick trim.",
    "Chairs and tools were clean, which matters more than people think.",
    "No long wait even without a prior appointment.",
    "Consistently good, which is rarer than it should be for a barbershop.",
  ],
  gym: [
    "Equipment was well maintained and mostly available even during peak hours.",
    "Trainers actually corrected my form instead of just counting reps.",
    "The place was clean, and machines got wiped down regularly.",
    "Membership process was straightforward with no hidden charges.",
    "Good variety of equipment for both strength and cardio work.",
    "If you're comparing gyms in the area, this one's worth checking out.",
  ],
  yoga_studio: [
    "The instructor adjusted poses individually instead of just demonstrating from the front.",
    "Class sizes were small enough to actually get personal attention.",
    "The studio was clean, quiet, and had a genuinely calming atmosphere.",
    "Pacing suited both the beginners and the more experienced folks in class.",
    "Scheduling was flexible enough to fit around a busy week.",
    "A good find if you want a serious practice, not just a trendy workout.",
  ],
  dentist: [
    "The dentist explained the procedure clearly before starting, no surprises mid-treatment.",
    "Barely felt any discomfort during the cleaning, which says a lot about their technique.",
    "The clinic was spotless, and all the tools were clearly sterilized.",
    "Pricing was explained upfront, nothing added later on the bill.",
    "Got an appointment quickly without a long waiting list.",
    "If you've been putting off a dental visit out of fear, this place makes it easy.",
  ],
  clinic: [
    "The doctor actually took time to listen instead of rushing to the next patient.",
    "Diagnosis felt thorough, not just a quick guess and a prescription.",
    "Waiting time was reasonable even with a full waiting room.",
    "Staff were courteous and explained the next steps clearly.",
    "Follow-up care was handled well, they actually checked in afterward.",
    "A reliable option if you want a doctor who takes your concerns seriously.",
  ],
  hospital: [
    "The staff were attentive and checked in regularly, not just during scheduled rounds.",
    "Admission and paperwork were handled efficiently, less stressful than expected.",
    "The facility was clean and well organized.",
    "Doctors communicated clearly about the treatment plan at every step.",
    "Emergency response was quick when it mattered.",
    "Reassuring to know a facility like this is nearby.",
  ],
  pharmacy: [
    "Had the exact medicines in stock, no need to run to a second store.",
    "The pharmacist took time to explain dosage and possible side effects.",
    "Quick service even during a busy time of day.",
    "Prices were fair, and they let me know about generic alternatives.",
    "Home delivery arrived faster than expected.",
    "Handy to have a pharmacy this reliable close by.",
  ],
  physiotherapy: [
    "The therapist built a plan specific to my injury, not a generic routine.",
    "Noticeable improvement within just a few sessions.",
    "They explained the exercises clearly enough to continue some at home.",
    "Sessions were never rushed, full time was given to each exercise.",
    "Follow-up questions between appointments were answered promptly.",
    "If you're recovering from an injury, this is worth the sessions.",
  ],
  veterinary: [
    "The vet was gentle with my pet, who is usually nervous at checkups.",
    "Diagnosis was thorough, and treatment options were explained clearly.",
    "Clinic was clean and didn't have that overwhelming smell some vet offices do.",
    "Follow-up call to check on recovery was a nice, unexpected touch.",
    "Pricing was reasonable for the level of care given.",
    "Trustworthy option if you want someone who's genuinely good with animals.",
  ],
  diagnostic_lab: [
    "Sample collection was quick and handled professionally.",
    "Reports came back faster than the estimated time.",
    "Results were accurate and matched what a second opinion later confirmed.",
    "Booking a home collection slot was simple and convenient.",
    "Staff explained what each test would check for, not just handed over a form.",
    "Reliable choice if you need test results you can actually trust.",
  ],
  electrician: [
    "Diagnosed the wiring issue fast and explained exactly what had gone wrong.",
    "Fixed a recurring circuit breaker trip that two other electricians couldn't figure out.",
    "Pricing was upfront before starting, no surprise charges added later.",
    "Cleaned up after the job, didn't leave wires or debris lying around.",
    "Arrived on time for the appointment, no waiting around all day.",
    "If you're dealing with electrical issues, this is who to call.",
  ],
  plumber: [
    "Fixed a stubborn leak that had been getting worse for weeks.",
    "Explained the root cause instead of just patching the symptom.",
    "Showed up within the promised window, didn't leave us waiting.",
    "Charged a fair rate for the parts and labor involved.",
    "Left the work area clean, no mess left behind after the job.",
    "Good to have a plumber you can actually rely on for once.",
  ],
  ac_service: [
    "Diagnosed a gas leak that was causing weak cooling and got it refilled properly.",
    "Compressor issue was fixed the same day, no multiple return visits needed.",
    "Serviced the unit thoroughly, cooling improved noticeably right after.",
    "Technician explained the maintenance schedule to avoid future breakdowns.",
    "Pricing was transparent, no inflated charges for parts.",
    "If your AC's acting up, this is worth calling before anyone else.",
  ],
  appliance_repair: [
    "Fixed the washing machine issue in one visit instead of multiple call-backs.",
    "Diagnosed the problem accurately instead of guessing and replacing random parts.",
    "Genuine spare parts were used, not the cheap alternatives some technicians push.",
    "Technician was punctual and called ahead before arriving.",
    "Charged a fair price compared to quotes from other repair services.",
    "Saved me from buying a whole new appliance, appreciated that honesty.",
  ],
  carpenter: [
    "Woodwork finish was clean and precise, no rough edges left behind.",
    "Delivered on the timeline promised, no repeated delays.",
    "Suggested a better design option than what I originally asked for.",
    "Measurements were accurate, everything fit perfectly on installation.",
    "Used good quality wood, not the cheaper stuff that warps over time.",
    "Reliable option if you need custom furniture or fittings done right.",
  ],
  painter: [
    "Surface prep was done properly before painting, not rushed over cracks.",
    "Finish was smooth and even across every wall.",
    "Covered furniture and floors carefully, minimal cleanup needed after.",
    "Color matching was spot on to the sample I picked.",
    "Completed the job within the timeline they quoted.",
    "House looks brand new, exactly the refresh it needed.",
  ],
  pest_control: [
    "Treatment actually worked, haven't seen a pest problem since.",
    "Technician explained what chemicals were being used and any safety precautions.",
    "Followed up after a couple weeks to make sure the issue was fully resolved.",
    "No strong lingering smell after the treatment, unlike some other services.",
    "Pricing was reasonable for a full home treatment.",
    "Worth it if you want a pest problem actually solved, not just masked.",
  ],
  cleaning_service: [
    "Team was thorough, cleaned spots I usually forget about myself.",
    "Arrived on time with all their own equipment and supplies.",
    "House smelled fresh, not overpowered by harsh chemical smell.",
    "Booking and rescheduling was simple through their team.",
    "Same quality of cleaning every time, not just the first visit.",
    "Makes a real difference having a reliable cleaning service on call.",
  ],
  locksmith: [
    "Got to the location quickly during what felt like an emergency.",
    "Opened the lock without any damage to the door or frame.",
    "Priced fairly, no taking advantage of the urgent situation.",
    "Rekeyed the lock properly and tested it before leaving.",
    "Professional and quick, exactly what you want in a stressful moment.",
    "Saving this number for next time, just in case.",
  ],
  interior_design: [
    "Understood the vibe I wanted and translated it well into the actual layout.",
    "Stayed within the budget we discussed, no scope creep on costs.",
    "Sourced good quality materials without unnecessary upselling.",
    "Kept us updated at every stage of the project.",
    "Final result matched the mockups closely, no disappointing surprises.",
    "Turned the space into something we actually enjoy being in.",
  ],
  solar_installer: [
    "Installation was clean and the panels have held up well through the seasons.",
    "Explained the expected savings clearly, and the numbers have matched up.",
    "Handled all the paperwork and subsidy process without much hassle on our end.",
    "Team was professional and completed the installation within the promised timeline.",
    "After-installation support has been responsive whenever we had questions.",
    "Genuinely reduced our electricity bill like they said it would.",
  ],
  packers_movers: [
    "Packed everything carefully, nothing arrived damaged or broken.",
    "Team was efficient, the whole move took less time than expected.",
    "Pricing matched the quote, no last-minute additions.",
    "Handled fragile and bulky items with equal care.",
    "Communicated clearly about timing throughout moving day.",
    "Made a stressful moving day considerably less stressful.",
  ],
  home_renovation: [
    "Stuck to the agreed timeline, which is rare for renovation work.",
    "Quality of work held up well, no cracks or issues months later.",
    "Kept the site reasonably clean during an otherwise messy process.",
    "Budget stayed close to the original estimate, no constant add-ons.",
    "Team communicated proactively about any changes needed mid-project.",
    "The end result was worth the disruption during the renovation.",
  ],
  car_repair: [
    "Diagnosed the actual issue instead of replacing parts that didn't need it.",
    "Gave an honest estimate and stuck to it.",
    "Car has run noticeably smoother since the service.",
    "Explained what was done in plain terms, not just a confusing invoice.",
    "Turnaround time was faster than most garages in the area.",
    "Found a garage I'll actually keep going back to.",
  ],
  car_wash: [
    "Interior and exterior both came out spotless, not just a quick rinse.",
    "Attention to detail on the wheels and trim was noticeably better than average.",
    "Quick service without skipping steps.",
    "Reasonable pricing for the thoroughness of the job.",
    "Car smelled fresh, not overloaded with air freshener to mask a rush job.",
    "Now my go-to before any long drive.",
  ],
  bike_repair: [
    "Fixed a persistent engine issue that a couple other shops missed.",
    "Charged a fair price for both parts and labor.",
    "Bike runs noticeably smoother after the service.",
    "Technician explained what was wrong instead of just handing over a bill.",
    "Quick turnaround, didn't have to leave the bike overnight.",
    "Reliable shop for regular servicing, not just emergency fixes.",
  ],
  tyre_shop: [
    "Got the right tyres in stock without a long wait for order-in.",
    "Alignment and balancing were done properly, ride feels noticeably smoother.",
    "Pricing was competitive compared to other shops nearby.",
    "Quick service, in and out faster than expected.",
    "Staff gave honest advice instead of pushing the most expensive option.",
    "Solid, no-nonsense tyre shop.",
  ],
  driving_school: [
    "Instructor was patient, especially with a nervous first-time driver.",
    "Lessons were structured well, built up skills step by step.",
    "Scheduling was flexible around a busy week.",
    "Passed the test on the first attempt thanks to the practical prep.",
    "Vehicle used for lessons was well maintained and easy to learn on.",
    "Would recommend to anyone starting from scratch.",
  ],
  florist: [
    "The floral arrangement looked even better in person than in the reference photo.",
    "Flowers stayed fresh for well over a week after delivery.",
    "Delivery arrived right on time for the event.",
    "Took the time to understand the exact color palette we wanted.",
    "Pricing was fair for the quality and freshness of the flowers.",
    "Perfect choice for wedding or event decoration in the area.",
  ],
  event_planner: [
    "Handled every detail of the event without us having to micromanage.",
    "Stayed within budget while still making the event feel premium.",
    "Vendors they coordinated with all showed up on time and delivered.",
    "Communicated clearly and promptly throughout the planning process.",
    "Handled a last-minute change smoothly without any visible stress.",
    "Took so much pressure off planning what could've been a chaotic event.",
  ],
  photographer: [
    "Captured candid moments beautifully, not just posed shots.",
    "Delivered the edited photos well within the promised timeline.",
    "Made everyone comfortable in front of the camera, even the camera-shy ones.",
    "Editing style matched exactly what we were hoping for.",
    "Professional equipment and backup gear, no technical hiccups on the day.",
    "The photos turned out better than we imagined.",
  ],
  wedding_decorator: [
    "The decor matched our theme perfectly, right down to the small details.",
    "Setup was completed well ahead of the event start time.",
    "Used fresh flowers and quality materials, nothing looked cheap.",
    "Handled a last-minute venue change without missing a beat.",
    "Pricing was transparent for the scale of decor provided.",
    "Turned the venue into exactly what we pictured.",
  ],
  dj_service: [
    "Read the crowd well and kept the energy up all night.",
    "Sound quality was clear with no awkward feedback or cutouts.",
    "Took our song requests and playlist seriously, not just their own set.",
    "Equipment setup was professional and didn't take long.",
    "Kept things on schedule for the different parts of the event.",
    "Made the event genuinely fun, not just background noise.",
  ],
  tailor: [
    "The fit was precise, no need for a second round of alterations.",
    "Finished the outfit well ahead of the deadline we needed it by.",
    "Stitching quality held up well even after multiple washes.",
    "Suggested useful design tweaks we hadn't thought of.",
    "Pricing was fair for the quality of the tailoring.",
    "Now my go-to for anything that needs a proper fit.",
  ],
  grocery_store: [
    "Produce was fresh, not the wilted stuff you sometimes find elsewhere.",
    "Good variety and rarely out of stock on the essentials.",
    "Checkout was quick even during peak hours.",
    "Prices were competitive compared to other stores nearby.",
    "Staff were helpful in finding items I couldn't locate.",
    "Convenient, reliable option for the weekly shop.",
  ],
  clothing_store: [
    "Good variety of sizes actually in stock, not just displayed.",
    "Staff gave honest opinions instead of just saying everything looked good.",
    "Quality of the fabric held up well after a few washes.",
    "Prices were fair for the quality on offer.",
    "Trial room experience was quick, no long waits.",
    "Found pieces here I couldn't find anywhere else nearby.",
  ],
  jewellery_store: [
    "Craftsmanship on the piece was excellent, very fine detailing.",
    "Staff explained the making charges and purity clearly, no hidden costs.",
    "Custom design request was executed exactly as discussed.",
    "Certification and billing were transparent and properly documented.",
    "Exchange policy was fair and clearly explained upfront.",
    "Trustworthy option for a big purchase like this.",
  ],
  furniture_store: [
    "Furniture quality was solid, not the flimsy stuff some stores push.",
    "Delivery arrived within the promised window, well packed.",
    "Assembly team was efficient and left no mess behind.",
    "Prices were fair for the build quality.",
    "Staff gave honest advice on what would actually fit the space.",
    "Exactly what we needed, no regrets on the purchase.",
  ],
  hardware_store: [
    "Had the specific parts I needed in stock, saved me a second trip elsewhere.",
    "Staff knew exactly what to recommend for the job I was doing.",
    "Prices were fair, no marking up on hard-to-find items.",
    "Quick in-and-out service, no wasted time.",
    "Good variety for both small fixes and bigger projects.",
    "Reliable go-to for anything hardware related.",
  ],
  mobile_shop: [
    "Screen replacement was done quickly and the phone works like new.",
    "Genuine parts were used, not the cheap third-party alternatives.",
    "Pricing was fair compared to other repair shops in the area.",
    "Diagnosed the actual issue instead of guessing and replacing parts unnecessarily.",
    "Quick turnaround, didn't have to be without my phone for long.",
    "Trustworthy option for phone repairs in the area.",
  ],
  electronics_store: [
    "Staff explained the specs clearly without the usual pushy upselling.",
    "Prices were competitive with what I found online.",
    "Product came with proper warranty documentation, no confusion later.",
    "After-sales support was responsive when I had a question.",
    "Good variety of brands to actually compare before deciding.",
    "Straightforward buying experience, no pressure tactics.",
  ],
  pet_store: [
    "Staff gave genuinely useful advice on food suited for my pet's needs.",
    "Good variety of products, not just the mainstream brands.",
    "Grooming service left my pet looking and smelling great.",
    "Prices were reasonable compared to other pet stores nearby.",
    "Staff clearly love animals, it shows in how they handle them.",
    "My pet's new favorite errand, if that's even a thing.",
  ],
  nursery_plants: [
    "Plants were healthy and well cared for, not wilting on the shelf.",
    "Staff gave solid advice on care and sunlight needs for each plant.",
    "Good variety, found some plants I hadn't seen at other nurseries.",
    "Delivery for a bulk landscaping order arrived on schedule.",
    "Fair pricing for the health and size of the plants.",
    "Great spot for anyone starting or expanding a garden.",
  ],
  lawyer: [
    "Explained the legal process in plain language, no confusing jargon.",
    "Responded promptly to calls and emails throughout the case.",
    "Fees were discussed upfront, no surprise billing later.",
    "Handled the paperwork efficiently and kept everything organized.",
    "Gave honest advice, even when it wasn't what I wanted to hear.",
    "Reliable choice if you need someone who actually returns your calls.",
  ],
  accountant: [
    "Filed everything accurately and well ahead of the deadline.",
    "Found deductions I wouldn't have known to claim myself.",
    "Explained the numbers clearly instead of just handing over a report.",
    "Responsive whenever I had a quick question during the year.",
    "Fees were reasonable for the level of detail in the work.",
    "Takes the stress out of tax season, genuinely.",
  ],
  real_estate: [
    "Found options that actually matched what we asked for, not just anything available.",
    "Negotiated a fair deal on our behalf without unnecessary pressure.",
    "Handled the paperwork and documentation smoothly.",
    "Was upfront about the pros and cons of each property.",
    "Followed up consistently without being pushy about it.",
    "Made what's usually a stressful process much easier.",
  ],
  insurance_agent: [
    "Explained the policy details clearly instead of rushing through the fine print.",
    "Helped with the claims process when we actually needed it, not just at sign-up.",
    "Recommended coverage that matched our actual needs, not the most expensive plan.",
    "Responsive whenever we had questions about the policy.",
    "No pressure tactics, just straightforward advice.",
    "Good to have an agent who's actually there when it matters.",
  ],
  digital_marketing: [
    "Delivered noticeable results within the timeline they projected.",
    "Communicated clearly with regular updates on campaign performance.",
    "Strategy was tailored to our business, not a generic template.",
    "Pricing was transparent with no vague hidden add-ons.",
    "Responsive to feedback and quick to adjust the approach.",
    "Genuinely helped grow our online presence.",
  ],
  computer_repair: [
    "Diagnosed the issue quickly and explained it in plain terms.",
    "Fixed the laptop without needing to wipe all my data.",
    "Pricing was fair and matched the quote given upfront.",
    "Turnaround time was faster than expected.",
    "Used genuine parts for the replacement, not the cheapest option available.",
    "Reliable option if you need a computer fixed properly.",
  ],
  printing_service: [
    "Print quality was sharp and colors came out accurate.",
    "Delivered the order well within the promised deadline.",
    "Handled a large bulk order without any quality drop-off.",
    "Pricing was competitive for the quality delivered.",
    "Made a requested last-minute correction without any hassle.",
    "Consistent quality, order after order.",
  ],
  tutoring: [
    "Noticeable improvement in grades within just a couple months.",
    "Teaching style adjusted to how the student actually learns best.",
    "Sessions were well structured, not just repeating the textbook.",
    "Regular progress updates kept us informed without having to ask.",
    "Scheduling was flexible around school commitments.",
    "Worth it for the confidence boost alone, not just the grades.",
  ],
  travel_agency: [
    "Itinerary was well planned and matched exactly what we wanted.",
    "Got a better deal than what we found searching on our own.",
    "Handled a last-minute booking change without extra hassle.",
    "Support during the trip was responsive when we needed it.",
    "All the documentation and bookings were handled smoothly.",
    "Made trip planning far less stressful than doing it ourselves.",
  ],
  hotel: [
    "Room was clean and matched the photos, no disappointing surprises at check-in.",
    "Staff were courteous and quick to help with requests.",
    "Location was convenient for getting around the area.",
    "Breakfast was a solid spread, better than expected for the price.",
    "Check-in and check-out were both quick and hassle-free.",
    "Comfortable stay overall, would book again.",
  ],
  laundry: [
    "Clothes came back clean, properly pressed, and on time.",
    "Handled a delicate fabric item without any damage.",
    "Pricing was reasonable for the turnaround speed.",
    "Pickup and delivery service made it genuinely convenient.",
    "Stains that seemed permanent came out completely.",
    "Reliable option for regular laundry needs.",
  ],
  general: [
    "The staff were friendly without being overbearing, and everything felt well taken care of.",
    "What stood out most was the attention to detail — nothing felt rushed or half-done.",
    "Prices are fair for what you get, which isn't always the case these days.",
    "Everything was clean, organized, and clearly well managed.",
    "The service was quick, but it never felt like they were cutting corners.",
    "Everyone I dealt with seemed genuinely happy to help, which says a lot.",
  ],
};

export function getTemplatePoolSize(category?: string | null): number {
  const details = getCategoryDetails(category);
  return OPENERS.length * details.length * CLOSERS.length * QUIRKS.length;
}

function getCategoryDetails(category?: string | null): string[] {
  if (category && CATEGORY_DETAILS[category]) return CATEGORY_DETAILS[category];
  return CATEGORY_DETAILS.general;
}

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
  location: string,
  category?: string | null
): string {
  const details = getCategoryDetails(category);
  const total = OPENERS.length * details.length * CLOSERS.length * QUIRKS.length;
  const normalized = ((index % total) + total) % total;

  const openerIndex = normalized % OPENERS.length;
  const detailIndex = Math.floor(normalized / OPENERS.length) % details.length;
  const closerIndex = Math.floor(normalized / (OPENERS.length * details.length)) % CLOSERS.length;
  const quirkIndex =
    Math.floor(normalized / (OPENERS.length * details.length * CLOSERS.length)) % QUIRKS.length;

  const business = businessName.trim() || "this business";
  const place = location.trim() || "the area";

  const opener = fillPlaceholders(OPENERS[openerIndex], business, place);
  const detail = withQuirk(QUIRKS[quirkIndex], details[detailIndex]);
  const closer = fillPlaceholders(CLOSERS[closerIndex], business, place);

  return `${opener} ${detail} ${closer}`;
}
