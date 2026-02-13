"use client";

import { useState, useEffect, useRef } from "react";
import { Globe, Copy, Download, Star, ExternalLink, Settings as SettingsIcon, CheckCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function Dashboard() {
  const [googleReviewsUrl, setGoogleReviewsUrl] = useState("https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG8391Ic");
  const [showSuccess, setShowSuccess] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("ai_qr_settings");
    if (saved) {
      try {
        const { googleReviewsUrl: savedUrl } = JSON.parse(saved);
        if (savedUrl) setGoogleReviewsUrl(savedUrl);
      } catch (err) {
        console.error("Failed to load settings", err);
      }
    }
  }, []);

  const qrLink = isClient ? `${window.location.origin}/qr` : '';

  const saveSettings = () => {
    localStorage.setItem("ai_qr_settings", JSON.stringify({ googleReviewsUrl }));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
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

  if (!isClient) return null;

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
        </header>

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
                </div>

                <div className="pt-4">
                  <button
                    onClick={saveSettings}
                    className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 active:scale-[0.98]"
                  >
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
