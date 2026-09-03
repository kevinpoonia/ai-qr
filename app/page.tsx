"use client";

import { useState, useEffect, useRef } from "react";
import { Globe, Copy, Download, Star, ExternalLink, Settings as SettingsIcon, CheckCircle2, Users, Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import NavBar from "./components/NavBar";
import type { FeedbackMode } from "@/lib/types";

export default function Dashboard() {
  const [googleReviewsUrl, setGoogleReviewsUrl] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>("gated");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        setGoogleReviewsUrl(data.googleReviewsUrl ?? "");
        setBusinessName(data.businessName ?? "");
        setFeedbackMode(data.feedbackMode === "open" ? "open" : "gated");
      } catch (err) {
        console.error("Failed to load settings", err);
        setError("Could not load settings from the server.");
      } finally {
        setIsLoading(false);
      }
    };

    const loadCustomerCount = async () => {
      try {
        const res = await fetch("/api/customers");
        const data = await res.json();
        setCustomerCount(Array.isArray(data.customers) ? data.customers.length : 0);
      } catch (err) {
        console.error("Failed to load customers", err);
      }
    };

    loadSettings();
    loadCustomerCount();
  }, []);

  const qrLink = isClient ? `${window.location.origin}/qr` : '';

  const saveSettings = async () => {
    setError("");
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, googleReviewsUrl, feedbackMode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save settings");
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
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
      downloadLink.download = "ai-review-qr.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(qrLink);
  };

  const changePassword = async () => {
    setPasswordError("");
    setPasswordSuccess(false);
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to change password");
      }
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!isClient || isLoading) return null;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 p-8 sm:p-12 lg:p-20 font-sans selection:bg-purple-100">
      <div className="max-w-6xl mx-auto space-y-16">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
              System v1.0
            </div>
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none italic">
              AI QR <span className="text-purple-600 whitespace-nowrap">SYSTEM.</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-lg leading-relaxed">
              Generate unique, SEO-optimized customer reviews with a single scan.
              Boost your local business ranking effortlessly.
            </p>
          </div>
          <NavBar />
        </header>

        {customerCount !== null && (
          <Link
            href="/customers"
            className="flex items-center justify-between gap-6 bg-slate-900 text-white rounded-[2rem] px-10 py-8 hover:bg-black transition-all group"
          >
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black">{customerCount} customer{customerCount === 1 ? "" : "s"} tracked</p>
                <p className="text-slate-400 text-sm font-medium">Manage names, phone numbers &amp; review history</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          </Link>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* QR Code Section */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white rounded-[3rem] p-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] border border-slate-100 flex flex-col items-center group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500" />

              <div ref={qrRef} className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 transition-all duration-700 group-hover:scale-[1.02] group-hover:rotate-1">
                <QRCodeSVG
                  value={qrLink}
                  size={250}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="mt-12 w-full space-y-4">
                <button
                  onClick={downloadQR}
                  className="w-full py-5 rounded-2xl bg-slate-950 text-white font-bold hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]"
                >
                  <Download className="w-5 h-5" />
                  Download High-Res PNG
                </button>
                <button
                  onClick={copyLink}
                  className="w-full py-5 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                >
                  <Copy className="w-5 h-5" />
                  Copy Experience Link
                </button>
              </div>
            </div>

            <div className="bg-purple-50 rounded-[2rem] p-8 border border-purple-100/50">
              <h3 className="text-sm font-black uppercase tracking-widest text-purple-900 mb-2">Live Link</h3>
              <div className="font-mono text-xs text-purple-600 break-all select-all outline-none bg-white/50 p-4 rounded-xl border border-purple-200">
                {qrLink}
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white rounded-[3rem] p-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden h-full">
              <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <SettingsIcon className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-black tracking-tight">System Configuration</h2>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your Business Name"
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-5 text-lg font-medium focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
                    <Globe className="w-4 h-4" />
                    Google Reviews Target URL
                  </label>
                  <div className="relative group">
                    <input
                      type="url"
                      value={googleReviewsUrl}
                      onChange={(e) => setGoogleReviewsUrl(e.target.value)}
                      placeholder="https://search.google.com/local/writereview?..."
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-5 text-lg font-medium focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">
                    This is where customers will land after copying their AI-generated review.
                    Ensure this is your direct &quot;Write a Review&quot; link.
                  </p>
                  {error && (
                    <p className="text-sm text-red-500 font-bold">{error}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
                    Feedback Routing
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setFeedbackMode("gated")}
                      className={`text-left p-5 rounded-2xl border-2 transition-all ${
                        feedbackMode === "gated"
                          ? "border-purple-200 bg-purple-50"
                          : "border-slate-100 bg-slate-50 hover:border-slate-200"
                      }`}
                    >
                      <p className="font-bold text-slate-900 text-sm">Gated</p>
                      <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                        4-5★ go to your review link. 1-3★ go to a private inbox only.
                      </p>
                    </button>
                    <button
                      onClick={() => setFeedbackMode("open")}
                      className={`text-left p-5 rounded-2xl border-2 transition-all ${
                        feedbackMode === "open"
                          ? "border-purple-200 bg-purple-50"
                          : "border-slate-100 bg-slate-50 hover:border-slate-200"
                      }`}
                    >
                      <p className="font-bold text-slate-900 text-sm">Always Open</p>
                      <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                        Every customer can choose: public review or private feedback.
                      </p>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Heads up: routing only low ratings to a private inbox (&quot;Gated&quot;) is the pattern targeted by the FTC&apos;s 2024 rule on review gating in the US. &quot;Always Open&quot; is the safer default if you operate there.
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    onClick={saveSettings}
                    disabled={isSaving}
                    className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 active:scale-[0.98] disabled:opacity-60"
                  >
                    {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                    Save Configuration
                    {showSuccess && <CheckCircle2 className="w-5 h-5 animate-in zoom-in" />}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                    <h4 className="font-bold text-slate-900">SEO Optimized</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Reviews are crafted with high-value business keywords.</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-slate-900">One-Tap Flow</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Minimized friction between scanning and submitting.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] p-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] border border-slate-100 max-w-xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Admin Password</h2>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-medium focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all placeholder:text-slate-300"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min. 8 characters)"
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-medium focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all placeholder:text-slate-300"
            />
            {passwordError && <p className="text-sm text-red-500 font-bold">{passwordError}</p>}
            <button
              onClick={changePassword}
              disabled={isChangingPassword || !currentPassword || !newPassword}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-slate-950 text-white font-bold hover:bg-black transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isChangingPassword ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              Update Password
              {passwordSuccess && <CheckCircle2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <footer className="pt-12 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">© 2026 AI QR System • Built for Growth</p>
          <div className="flex gap-8">
            <a href="#" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-purple-600 transition-colors">Safety</a>
            <a href="#" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-purple-600 transition-colors">API</a>
            <a href="#" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-purple-600 transition-colors">Docs</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
