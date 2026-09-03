"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { QrCode, Users, BarChart3, MessageSquareWarning, LogOut, UserCog, ShieldAlert } from "lucide-react";

const links = [
  { href: "/", label: "QR & Settings", icon: QrCode },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/feedback", label: "Feedback", icon: MessageSquareWarning },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/team", label: "Team", icon: UserCog },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setIsImpersonating(Boolean(data.impersonating)))
      .catch((err) => console.error("Failed to load current user", err));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const exitImpersonation = async () => {
    await fetch("/api/admin/exit-impersonation", { method: "POST" });
    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="flex flex-col items-end gap-3">
      {isImpersonating && (
        <button
          onClick={exitImpersonation}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 border border-amber-200 text-xs font-bold text-amber-800 hover:bg-amber-200 transition-all"
        >
          <ShieldAlert className="w-4 h-4" />
          Viewing as this client — exit to admin
        </button>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <nav className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 flex-wrap">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  active
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
