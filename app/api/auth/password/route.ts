import { NextResponse } from "next/server";
import { setAdminPassword, verifyAdminPassword } from "@/lib/auth-server";

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { currentPassword, newPassword } = body as Record<string, unknown>;

  if (typeof currentPassword !== "string" || !currentPassword) {
    return NextResponse.json({ error: "Current password is required" }, { status: 400 });
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters" },
      { status: 400 }
    );
  }

  if (!verifyAdminPassword(currentPassword)) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  setAdminPassword(newPassword);
  return NextResponse.json({ success: true });
}
