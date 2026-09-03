"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Users, Star, QrCode, TrendingUp, Loader2 } from "lucide-react";
import AdminNavBar from "../components/AdminNavBar";

interface StatsData {
  businesses: { total: number; active: number; suspended: number };
  totals: { customers: number; feedback: number; scans: number; reviews: number };
  signupTrend: { day: string; n: number }[];
  topBusinesses: { id: number; name: string; slug: string; totalReviews: number }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("Failed to load platform stats", err))
      .finally(() => setIsLoading(false));
  }, []);

  const maxSignup = data ? Math.max(1, ...data.signupTrend.map((d) => d.n)) : 1;
  const maxReviews = data ? Math.max(1, ...data.topBusinesses.map((b) => b.totalReviews)) : 1;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 p-8 sm:p-12 lg:p-20 font-sans selection:bg-purple-100">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
              Platform Admin
            </div>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none italic">
              Platform <span className="text-purple-600">Analytics.</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-lg leading-relaxed">
              How the whole platform is performing, across every client.
            </p>
          </div>
          <AdminNavBar />
        </header>

        {isLoading || !data ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon={<Building2 className="w-5 h-5" />} color="purple" value={data.businesses.total} label="Total Clients" />
              <StatCard icon={<QrCode className="w-5 h-5" />} color="blue" value={data.totals.scans} label="Total Scans" />
              <StatCard icon={<Star className="w-5 h-5 fill-current" />} color="emerald" value={data.totals.reviews} label="Reviews Completed" />
              <StatCard icon={<Users className="w-5 h-5" />} color="rose" value={data.totals.customers} label="Total Customers" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.06)] space-y-2">
                <p className="text-3xl font-black text-emerald-600">{data.businesses.active}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Clients</p>
              </div>
              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.06)] space-y-2">
                <p className="text-3xl font-black text-rose-600">{data.businesses.suspended}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Suspended Clients</p>
              </div>
              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.06)] space-y-2">
                <p className="text-3xl font-black">{data.totals.feedback}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Feedback</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] space-y-6">
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" /> Signups — Last 30 Days
                </h2>
                <div className="flex items-end gap-1 h-40">
                  {data.signupTrend.map((d) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full group" title={`${d.n} on ${d.day}`}>
                      <div
                        className="w-full rounded-t bg-purple-500 group-hover:bg-purple-600 transition-colors"
                        style={{ height: `${(d.n / maxSignup) * 100}%`, minHeight: d.n > 0 ? "4px" : 0 }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] space-y-6">
                <h2 className="text-xl font-black tracking-tight">Top Clients by Reviews</h2>
                <div className="space-y-3">
                  {data.topBusinesses.map((b) => (
                    <Link
                      key={b.id}
                      href={`/admin/clients/${b.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <span className="w-32 text-sm font-bold text-slate-700 truncate">{b.name}</span>
                      <div className="flex-1 h-3 rounded-full bg-slate-50 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 group-hover:opacity-80"
                          style={{ width: `${(b.totalReviews / maxReviews) * 100}%` }}
                        />
                      </div>
                      <span className="w-10 text-sm font-bold text-slate-400 text-right">{b.totalReviews}</span>
                    </Link>
                  ))}
                  {data.topBusinesses.length === 0 && (
                    <p className="text-sm text-slate-400 font-medium">No data yet.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  color,
  value,
  label,
}: {
  icon: React.ReactNode;
  color: "purple" | "blue" | "emerald" | "rose";
  value: number | string;
  label: string;
}) {
  const colorMap = {
    purple: "bg-purple-100 text-purple-600",
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    rose: "bg-rose-100 text-rose-600",
  };
  return (
    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.06)] space-y-2">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 ${colorMap[color]}`}>{icon}</div>
      <p className="text-3xl font-black">{value}</p>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}
