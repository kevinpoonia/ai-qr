"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Star, RefreshCw } from "lucide-react";

export default function QRPage() {
    const [review, setReview] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const [googleUrl, setGoogleUrl] = useState("https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG8391Ic");

    const fetchReview = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/generate-review");
            const data = await res.json();
            setReview(data.review);
        } catch (error) {
            console.error("Failed to fetch review", error);
            setReview("The service was excellent and the team was very professional. Highly recommended!");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReview();
        const savedSettings = localStorage.getItem("ai_qr_settings");
        if (savedSettings) {
            try {
                const { googleReviewsUrl } = JSON.parse(savedSettings);
                if (googleReviewsUrl) setGoogleUrl(googleReviewsUrl);
            } catch (err) {
                console.error("Failed to load settings", err);
            }
        }
    }, []);

    const handleCopyAndContinue = async () => {
        try {
            await navigator.clipboard.writeText(review);
            setIsCopied(true);
            setTimeout(() => {
                window.location.href = googleUrl;
            }, 1000);
        } catch (err) {
            console.error("Failed to copy text", err);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 space-y-8 antialiased">
            <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 text-purple-600 text-xs font-bold border border-purple-100 mb-2 animate-pulse">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    AI Review Assistant
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                    Share Your Experience
                </h1>
                <p className="text-slate-500 font-medium max-w-sm mx-auto">
                    We&apos;ve drafted a unique review for you. Feel free to use it or make it your own!
                </p>
            </div>

            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden relative">
                <div className="h-2 bg-gradient-to-r from-purple-500 to-blue-500" />
                <div className="p-10 space-y-8">
                    <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-100/80 relative min-h-[160px] flex items-center justify-center group tracking-tight">
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-4">
                                <RefreshCw className="w-10 h-10 text-purple-600 animate-spin" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Crafting Review...</p>
                            </div>
                        ) : (
                            <p className="italic text-slate-800 text-xl leading-relaxed text-center font-medium px-2">
                                &quot;{review}&quot;
                            </p>
                        )}
                        {!isLoading && (
                            <button
                                onClick={fetchReview}
                                className="absolute top-4 right-4 p-2.5 rounded-2xl hover:bg-white hover:shadow-lg transition-all text-slate-300 hover:text-purple-600 border border-transparent hover:border-slate-100"
                                title="Regenerate"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        <button
                            disabled={isLoading}
                            onClick={handleCopyAndContinue}
                            className={`w-full py-5 rounded-[1.5rem] text-lg font-bold transition-all duration-500 flex items-center justify-center gap-3 active:scale-[0.98] ${isCopied ? 'bg-emerald-500 text-white shadow-[0_20px_40px_-8px_rgba(16,185,129,0.3)]' : 'bg-slate-900 text-white hover:bg-black shadow-[0_20px_40px_-8px_rgba(15,23,42,0.3)]'}`}
                        >
                            {isCopied ? (
                                <>
                                    <span>Review Copied!</span>
                                </>
                            ) : (
                                <>
                                    <span>Copy & Continue</span>
                                    <ArrowRight className="w-6 h-6" />
                                </>
                            )}
                        </button>
                        <div className="flex items-center justify-center gap-2">
                            {[1, 2].map(i => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 1 && !isCopied ? 'bg-purple-500' : 'bg-slate-200'}`} />
                            ))}
                        </div>
                        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] pt-2">
                            Copy draft • Paste on Google
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 pt-4 opacity-50">
                <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-9 h-9 rounded-full border-2 border-[#fafafa] bg-slate-200" />
                    ))}
                </div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Powered by AI Feedback</p>
            </div>
        </div>
    );
}
