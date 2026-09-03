"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { QrCode, Users } from "lucide-react";

const links = [
  { href: "/", label: "QR & Settings", icon: QrCode },
  { href: "/customers", label: "Customers", icon: Users },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
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
  );
}
