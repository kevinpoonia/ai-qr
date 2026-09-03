"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  QrCode,
  Star,
  TrendingUp,
  Inbox,
  Check,
  Trash2,
  Download,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import AdminNavBar from "../../components/AdminNavBar";
import type { AdminBusiness, Customer, FeedbackEntry, FeedbackMode } from "@/lib/types";

interface AnalyticsData {
  totalScans: number;
  totalReviewsCompleted: number;
  totalFeedbackSubmitted: number;
  pendingFeedback: number;
  conversionRate: number;
  ratingDistribution: Record<string, number>;
}

export default function AdminClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [business, setBusiness] = useState<AdminBusiness | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyFeedbackId, setBusyFeedbackId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [googleReviewsUrl, setGoogleReviewsUrl] = useState("");
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>("gated");
  const [slug, setSlug] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const load = async () => {
    setIsLoading(true);
    try {
      const [bizRes, analyticsRes, customersRes, feedbackRes] = await Promise.all([
        fetch(`/api/admin/businesses/${id}`),
        fetch(`/api/admin/businesses/${id}/analytics`),
        fetch(`/api/admin/businesses/${id}/customers`),
        fetch(`/api/admin/businesses/${id}/feedback`),
      ]);
      if (!bizRes.ok) {
        throw new Error("Client not found");
      }
      const bizData = await bizRes.json();
      const b: AdminBusiness = bizData.business;
      setBusiness(b);
      setName(b.name);
      setLocation(b.location);
      setGoogleReviewsUrl(b.google_reviews_url);
      setFeedbackMode(b.feedback_mode);
      setSlug(b.slug);

      setAnalytics(await analyticsRes.json());
      const customersData = await customersRes.json();
      setCustomers(Array.isArray(customersData.customers) ? customersData.customers : []);
      const feedbackData = await feedbackRes.json();
      setFeedback(Array.isArray(feedbackData.feedback) ? feedbackData.feedback : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load client");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveSettings = async () => {
    setError("");
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: name,
          location,
          googleReviewsUrl,
          feedbackMode,
          slug,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings");
      }
      setBusiness(data.business);
      setSlug(data.business.slug);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const markResolved = async (feedbackId: number) => {
    setBusyFeedbackId(feedbackId);
    try {
      await fetch(`/api/admin/businesses/${id}/feedback/${feedbackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      setFeedback((prev) =>
        prev.map((f) => (f.id === feedbackId ? { ...f, status: "resolved" as const } : f))
      );
    } catch (err) {
      console.error("Failed to resolve feedback", err);
    } finally {
      setBusyFeedbackId(null);
    }
  };

  const removeFeedback = async (feedbackId: number) => {
    setBusyFeedbackId(feedbackId);
    try {
      await fetch(`/api/admin/businesses/${id}/feedback/${feedbackId}`, { method: "DELETE" });
      setFeedback((prev) => prev.filter((f) => f.id !== feedbackId));
    } catch (err) {
      console.error("Failed to delete feedback", err);
    } finally {
      setBusyFeedbackId(null);
    }
  };

  const qrLink = isClient && business ? `${window.location.origin}/qr/${business.slug}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(qrLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadQr = () => {
    const svg = document.getElementById("admin-client-qr")?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 900, 900);
      }
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${business?.slug ?? "client"}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center">
        <p className="text-slate-500 font-medium">{error || "Client not found."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 p-8 sm:p-12 lg:p-20 font-sans selection:bg-purple-100">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <div className="space-y-4">
            <button
              onClick={() => router.push("/admin")}
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Clients
            </button>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none italic">
              {business.name}
            </h1>
            <p className="text-slate-500 font-medium">/qr/{business.slug} · {business.owner_email ?? "no owner"}</p>
          </div>
          <AdminNavBar />
        </header>

        {error && <p className="text-sm text-red-500 font-bold">{error}</p>}

        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row items-center gap-10">
          <div id="admin-client-qr" className="p-5 bg-white rounded-[2rem] border-2 border-slate-50 shrink-0">
            {isClient && <QRCodeSVG value={qrLink} size={180} level="H" />}
          </div>
          <div className="space-y-4 text-center sm:text-left">
            <h2 className="text-xl font-black tracking-tight">Review QR Code</h2>
            <div className="font-mono text-xs text-purple-600 break-all bg-purple-50 px-4 py-3 rounded-xl border border-purple-100">
              {qrLink}
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <button
                onClick={downloadQr}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-950 text-white text-sm font-bold hover:bg-black transition-all"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </button>
              <button
                onClick={copyLink}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all"
              >
                {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {isCopied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        </div>

        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={<QrCode className="w-5 h-5" />} color="purple" value={analytics.totalScans} label="Total Scans" />
            <StatCard icon={<Star className="w-5 h-5 fill-current" />} color="blue" value={analytics.totalReviewsCompleted} label="Reviews Completed" />
            <StatCard icon={<TrendingUp className="w-5 h-5" />} color="emerald" value={`${Math.round(analytics.conversionRate * 100)}%`} label="Conversion Rate" />
            <StatCard icon={<Inbox className="w-5 h-5" />} color="rose" value={analytics.pendingFeedback} label="Pending Feedback" />
          </div>
        )}

        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] space-y-8">
          <h2 className="text-xl font-black tracking-tight">Client Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="Business Name" value={name} onChange={setName} />
            <Field label="Location" value={location} onChange={setLocation} />
            <Field label="Slug" value={slug} onChange={setSlug} mono />
            <Field label="Google Reviews URL" value={googleReviewsUrl} onChange={setGoogleReviewsUrl} />
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Feedback Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(["gated", "open"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFeedbackMode(mode)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    feedbackMode === mode ? "border-purple-200 bg-purple-50" : "border-slate-100 bg-slate-50"
                  }`}
                >
                  <p className="font-bold text-slate-900 text-sm capitalize">{mode}</p>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-all disabled:opacity-60"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
            {showSuccess && <CheckCircle2 className="w-4 h-4" />}
          </button>
        </div>

        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)]">
          <h2 className="text-xl font-black tracking-tight mb-6">Customers ({customers.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Phone</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Reviews</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 pr-4 font-bold">{c.name || "—"}</td>
                    <td className="py-3 pr-4 text-slate-500">{c.phone || "—"}</td>
                    <td className="py-3 pr-4 text-slate-500">{c.email || "—"}</td>
                    <td className="py-3 pr-4 text-slate-500">{c.review_count}</td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                      No customers yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)]">
          <h2 className="text-xl font-black tracking-tight mb-6">Feedback Inbox ({feedback.length})</h2>
          <div className="space-y-4">
            {feedback.map((entry) => (
              <div key={entry.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < entry.rating ? "text-amber-400 fill-current" : "text-slate-200"}`} />
                    ))}
                  </div>
                  {entry.status === "resolved" ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">Resolved</span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest">New</span>
                  )}
                </div>
                {entry.comment && <p className="text-sm text-slate-700 font-medium">{entry.comment}</p>}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 font-bold">
                    {[entry.customer_name, entry.customer_phone].filter(Boolean).join(" · ") || "Anonymous"}
                  </p>
                  <div className="flex gap-2">
                    {entry.status !== "resolved" && (
                      <button
                        onClick={() => markResolved(entry.id)}
                        disabled={busyFeedbackId === entry.id}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => removeFeedback(entry.id)}
                      disabled={busyFeedbackId === entry.id}
                      className="p-2 rounded-lg bg-white text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {feedback.length === 0 && (
              <p className="text-sm text-slate-400 font-medium text-center py-8">No feedback yet.</p>
            )}
          </div>
        </div>

        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all ${mono ? "font-mono" : ""}`}
      />
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
