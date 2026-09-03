export interface Settings {
  businessName: string;
  googleReviewsUrl: string;
}

export interface Customer {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  review_count: number;
  last_review_at: string | null;
  created_at: string;
}
