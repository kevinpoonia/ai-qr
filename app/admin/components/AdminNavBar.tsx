"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Building2, BarChart3, ShieldCheck, LogOut } from "lucide-react";

const links = [
  { href: "/admin", label: "Clients", icon: Building2 },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/admins", label: "Admins", icon: ShieldCheck },
];

export default function AdminNavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <nav className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 flex-wrap">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
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
  );
}
