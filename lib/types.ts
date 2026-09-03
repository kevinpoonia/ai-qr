export type FeedbackMode = "gated" | "open";
export type Role = "owner" | "staff" | "platform_admin";
export type BusinessStatus = "active" | "suspended";

export interface Business {
  id: number;
  name: string;
  slug: string;
  google_reviews_url: string;
  feedback_mode: FeedbackMode;
  status: BusinessStatus;
  created_at: string;
}

export interface AdminBusiness {
  id: number;
  name: string;
  slug: string;
  location: string;
  google_reviews_url: string;
  feedback_mode: FeedbackMode;
  status: BusinessStatus;
  created_at: string;
  owner_email: string | null;
}

export interface PlatformAdminUser {
  id: number;
  email: string;
  created_at: string;
}

export interface TeamMember {
  id: number;
  email: string;
  role: Role;
  created_at: string;
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
