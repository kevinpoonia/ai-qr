export type FeedbackMode = "gated" | "open";

export interface Settings {
  businessName: string;
  googleReviewsUrl: string;
  feedbackMode: FeedbackMode;
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

export interface FeedbackEntry {
  id: number;
  customer_id: number | null;
  rating: number;
  comment: string | null;
  status: "new" | "resolved";
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
}
