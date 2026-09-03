import type { Role } from "./types";

export interface SessionContext {
  userId: number;
  businessId: number | null;
  role: Role;
}

// proxy.ts verifies the session cookie and forwards these headers to every
// authenticated request; routes should still treat a missing header as
// unauthenticated in case they're ever reached without going through it.
// platform_admin sessions aren't scoped to a business, so x-business-id is
// only present for owner/staff.
export function getSessionContext(request: Request): SessionContext | null {
  const userId = request.headers.get("x-user-id");
  const businessId = request.headers.get("x-business-id");
  const role = request.headers.get("x-user-role");

  if (!userId || (role !== "owner" && role !== "staff" && role !== "platform_admin")) {
    return null;
  }
  if (role !== "platform_admin" && !businessId) {
    return null;
  }

  return {
    userId: Number(userId),
    businessId: businessId ? Number(businessId) : null,
    role,
  };
}
