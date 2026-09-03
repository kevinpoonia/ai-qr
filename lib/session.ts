import type { Role } from "./types";

export interface SessionContext {
  userId: number;
  businessId: number;
  role: Role;
}

// proxy.ts verifies the session cookie and forwards these headers to every
// authenticated request; routes should still treat a missing header as
// unauthenticated in case they're ever reached without going through it.
export function getSessionContext(request: Request): SessionContext | null {
  const userId = request.headers.get("x-user-id");
  const businessId = request.headers.get("x-business-id");
  const role = request.headers.get("x-user-role");

  if (!userId || !businessId || (role !== "owner" && role !== "staff")) {
    return null;
  }

  return { userId: Number(userId), businessId: Number(businessId), role };
}
