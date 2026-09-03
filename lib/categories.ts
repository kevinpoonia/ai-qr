// A curated set of common Google Business Profile / Google Maps categories
// for local service businesses. Not Google's full taxonomy (that runs into
// the thousands) — this covers the categories this platform's clients
// actually fall into, each with its own review-detail pool in
// lib/reviewTemplates.ts. "general" is the fallback for anything else.

export interface BusinessCategory {
  slug: string;
  label: string;
}

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  { slug: "restaurant", label: "Restaurant" },
  { slug: "cafe", label: "Cafe / Coffee Shop" },
  { slug: "bakery", label: "Bakery" },
  { slug: "sweet_shop", label: "Sweet Shop / Mithai" },
  { slug: "catering", label: "Catering Service" },
  { slug: "bar", label: "Bar / Pub" },
  { slug: "salon", label: "Hair Salon" },
  { slug: "spa", label: "Spa" },
  { slug: "beauty_parlour", label: "Beauty Parlour" },
  { slug: "barbershop", label: "Barbershop" },
  { slug: "gym", label: "Gym / Fitness Center" },
  { slug: "yoga_studio", label: "Yoga Studio" },
  { slug: "dentist", label: "Dentist" },
  { slug: "clinic", label: "Doctor / Clinic" },
  { slug: "hospital", label: "Hospital" },
  { slug: "pharmacy", label: "Pharmacy" },
  { slug: "physiotherapy", label: "Physiotherapist" },
  { slug: "veterinary", label: "Veterinary Clinic" },
  { slug: "diagnostic_lab", label: "Diagnostic Lab" },
  { slug: "electrician", label: "Electrician" },
  { slug: "plumber", label: "Plumber" },
  { slug: "ac_service", label: "AC Repair & Service" },
  { slug: "appliance_repair", label: "Appliance Repair Service" },
  { slug: "carpenter", label: "Carpenter" },
  { slug: "painter", label: "House Painter" },
  { slug: "pest_control", label: "Pest Control Service" },
  { slug: "cleaning_service", label: "Home / Office Cleaning Service" },
  { slug: "locksmith", label: "Locksmith" },
  { slug: "interior_design", label: "Interior Designer" },
  { slug: "solar_installer", label: "Solar Panel Installer" },
  { slug: "packers_movers", label: "Packers & Movers" },
  { slug: "home_renovation", label: "Home Renovation Contractor" },
  { slug: "car_repair", label: "Car Repair / Auto Garage" },
  { slug: "car_wash", label: "Car Wash" },
  { slug: "bike_repair", label: "Bike Repair Shop" },
  { slug: "tyre_shop", label: "Tyre Shop" },
  { slug: "driving_school", label: "Driving School" },
  { slug: "florist", label: "Flower Shop / Florist" },
  { slug: "event_planner", label: "Event Planner" },
  { slug: "photographer", label: "Photographer" },
  { slug: "wedding_decorator", label: "Wedding Decorator" },
  { slug: "dj_service", label: "DJ / Sound Service" },
  { slug: "tailor", label: "Tailor / Boutique" },
  { slug: "grocery_store", label: "Grocery Store" },
  { slug: "clothing_store", label: "Clothing Store" },
  { slug: "jewellery_store", label: "Jewellery Store" },
  { slug: "furniture_store", label: "Furniture Store" },
  { slug: "hardware_store", label: "Hardware Store" },
  { slug: "mobile_shop", label: "Mobile Shop" },
  { slug: "electronics_store", label: "Electronics Store" },
  { slug: "pet_store", label: "Pet Store" },
  { slug: "nursery_plants", label: "Plant Nursery" },
  { slug: "lawyer", label: "Lawyer" },
  { slug: "accountant", label: "Chartered Accountant / Tax Consultant" },
  { slug: "real_estate", label: "Real Estate Agent" },
  { slug: "insurance_agent", label: "Insurance Agent" },
  { slug: "digital_marketing", label: "Web Designer / Digital Marketing Agency" },
  { slug: "computer_repair", label: "Computer & Mobile Repair" },
  { slug: "printing_service", label: "Printing Service" },
  { slug: "tutoring", label: "Tutoring / Coaching Center" },
  { slug: "travel_agency", label: "Travel Agency" },
  { slug: "hotel", label: "Hotel / Guest House" },
  { slug: "laundry", label: "Laundry / Dry Cleaning" },
  { slug: "general", label: "General / Other" },
];

export const DEFAULT_CATEGORY_SLUG = "general";
