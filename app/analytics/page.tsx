"use client";

import { useEffect, useState } from "react";
import { QrCode, Star, TrendingUp, Inbox, Loader2 } from "lucide-react";
import NavBar from "../components/NavBar";

interface AnalyticsData {
  totalScans: number;
  totalReviewsCompleted: number;
  totalFeedbackSubmitted: number;
  pendingFeedback: number;
  conversionRate: number;
  ratingDistribution: Record<string, number>;
  dailyTrend: { day: string; scans: number; completions: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("Failed to load analytics", err))
      .finally(() => setIsLoading(false));
  }, []);

  const maxRating = data
    ? Math.max(1, ...Object.values(data.ratingDistribution).map(Number))
    : 1;
  const maxTrend = data
    ? Math.max(1, ...data.dailyTrend.map((d) => Math.max(d.scans, d.completions)))
    : 1;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 p-8 sm:p-12 lg:p-20 font-sans selection:bg-purple-100">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
              Insights
            </div>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none italic">
              Review <span className="text-purple-600">Analytics.</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-lg leading-relaxed">
              How your QR code is performing, scan by scan.
            </p>
          </div>
          <NavBar />
        </header>

        {isLoading || !data ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={<QrCode className="w-5 h-5" />}
                color="purple"
                value={data.totalScans}
                label="Total Scans"
              />
              <StatCard
                icon={<Star className="w-5 h-5 fill-current" />}
                color="blue"
                value={data.totalReviewsCompleted}
                label="Reviews Completed"
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                color="emerald"
                value={`${Math.round(data.conversionRate * 100)}%`}
                label="Conversion Rate"
              />
              <StatCard
                icon={<Inbox className="w-5 h-5" />}
                color="rose"
                value={data.pendingFeedback}
                label="Pending Feedback"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] space-y-6">
                <h2 className="text-xl font-black tracking-tight">Rating Distribution</h2>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = data.ratingDistribution[String(star)] ?? 0;
                    const pct = (count / maxRating) * 100;
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <span className="w-10 text-sm font-bold text-slate-500 flex items-center gap-1">
                          {star}
                          <Star className="w-3 h-3 fill-current text-amber-400" />
                        </span>
                        <div className="flex-1 h-4 rounded-full bg-slate-50 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-sm font-bold text-slate-400 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] space-y-6">
                <h2 className="text-xl font-black tracking-tight">Last 14 Days</h2>
                <div className="flex items-end gap-1.5 h-40">
                  {data.dailyTrend.map((d) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center justify-end gap-1 h-full group">
                      <div className="w-full flex-1 flex items-end justify-center gap-0.5">
                        <div
                          className="w-1/2 rounded-t bg-slate-200 group-hover:bg-slate-300 transition-colors"
                          style={{ height: `${(d.scans / maxTrend) * 100}%` }}
                          title={`${d.scans} scans`}
                        />
                        <div
                          className="w-1/2 rounded-t bg-purple-500 group-hover:bg-purple-600 transition-colors"
                          style={{ height: `${(d.completions / maxTrend) * 100}%` }}
                          title={`${d.completions} reviews`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> Scans
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Reviews
                  </span>
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
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-3xl font-black">{value}</p>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}
