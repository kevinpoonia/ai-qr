"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Star, RefreshCw, User, Phone, MessageSquare, CheckCircle2 } from "lucide-react";
import type { FeedbackMode } from "@/lib/types";

type Step = "rating" | "public_review" | "private_feedback" | "done";

const logEvent = (type: string, rating?: number) => {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, rating }),
  }).catch((err) => console.error("Failed to log event", err));
};

export default function QRPage() {
    const [step, setStep] = useState<Step>("rating");
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const [googleUrl, setGoogleUrl] = useState("");
    const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>("gated");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [comment, setComment] = useState("");
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

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
        logEvent("scan");

        const loadSettings = async () => {
            try {
                const res = await fetch("/api/settings");
                const data = await res.json();
                if (data.googleReviewsUrl) setGoogleUrl(data.googleReviewsUrl);
                if (data.feedbackMode) setFeedbackMode(data.feedbackMode);
            } catch (err) {
                console.error("Failed to load settings", err);
            }
        };
        loadSettings();
    }, []);

    const handleRating = (value: number) => {
        setRating(value);
        logEvent("rating", value);

        if (feedbackMode === "gated") {
            if (value >= 4) {
                setStep("public_review");
                fetchReview();
            } else {
                setStep("private_feedback");
            }
        } else {
            // Open mode: always offer the choice, review draft is pre-fetched either way.
            fetchReview();
            setStep("public_review");
        }
    };

    const handleCopyAndContinue = async () => {
        try {
            await navigator.clipboard.writeText(review);
            setIsCopied(true);

            if (name.trim() || phone.trim()) {
                fetch("/api/customers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, phone, notes: review, logReview: true }),
                }).catch((err) => console.error("Failed to log customer", err));
            }

            logEvent("review_completed", rating);

            setTimeout(() => {
                window.location.href = googleUrl;
            }, 1000);
        } catch (err) {
            console.error("Failed to copy text", err);
        }
    };

    const submitFeedback = async () => {
        setIsSubmittingFeedback(true);
        try {
            await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating, comment, name, phone }),
            });
            logEvent("feedback_submitted", rating);
            setStep("done");
        } catch (err) {
            console.error("Failed to submit feedback", err);
        } finally {
            setIsSubmittingFeedback(false);
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
                    {step === "rating"
                        ? "How was your visit with us today?"
                        : "We've drafted a unique review for you. Feel free to use it or make it your own!"}
                </p>
            </div>

            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden relative">
                <div className="h-2 bg-gradient-to-r from-purple-500 to-blue-500" />
                <div className="p-10 space-y-8">
                    {step === "rating" && (
                        <div className="flex flex-col items-center gap-8 py-6">
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => handleRating(star)}
                                        className="p-1 transition-transform hover:scale-110 active:scale-95"
                                        title={`${star} star${star === 1 ? "" : "s"}`}
                                    >
                                        <Star className="w-10 h-10 text-slate-200 hover:text-amber-400 hover:fill-current transition-colors" />
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                                Tap a star to continue
                            </p>
                        </div>
                    )}

                    {step === "public_review" && (
                        <>
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

                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Stay in touch (optional)
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="relative">
                                        <User className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Your name"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Phone className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="Phone number"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    disabled={isLoading}
                                    onClick={handleCopyAndContinue}
                                    className={`w-full py-5 rounded-[1.5rem] text-lg font-bold transition-all duration-500 flex items-center justify-center gap-3 active:scale-[0.98] ${isCopied ? 'bg-emerald-500 text-white shadow-[0_20px_40px_-8px_rgba(16,185,129,0.3)]' : 'bg-slate-900 text-white hover:bg-black shadow-[0_20px_40px_-8px_rgba(15,23,42,0.3)]'}`}
                                >
                                    {isCopied ? (
                                        <span>Review Copied!</span>
                                    ) : (
                                        <>
                                            <span>Copy & Continue</span>
                                            <ArrowRight className="w-6 h-6" />
                                        </>
                                    )}
                                </button>
                                {feedbackMode === "open" && !isCopied && (
                                    <button
                                        onClick={() => setStep("private_feedback")}
                                        className="w-full py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Send private feedback instead
                                    </button>
                                )}
                                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] pt-2">
                                    Copy draft • Paste on Google
                                </p>
                            </div>
                        </>
                    )}

                    {step === "private_feedback" && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-6 h-6 ${i < rating ? "text-amber-400 fill-current" : "text-slate-200"}`}
                                    />
                                ))}
                            </div>
                            <p className="text-center text-slate-500 font-medium text-sm">
                                We&apos;re sorry it wasn&apos;t perfect. Tell us what happened &mdash; this goes straight to the business, not online.
                            </p>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="What could we have done better?"
                                rows={4}
                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all placeholder:text-slate-300 resize-none"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="relative">
                                    <User className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your name (optional)"
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="relative">
                                    <Phone className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Phone (optional)"
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all placeholder:text-slate-300"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={submitFeedback}
                                disabled={isSubmittingFeedback || !comment.trim()}
                                className="w-full py-5 rounded-[1.5rem] text-lg font-bold bg-slate-900 text-white hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                            >
                                Send Feedback
                            </button>
                        </div>
                    )}

                    {step === "done" && (
                        <div className="flex flex-col items-center gap-4 py-8 text-center">
                            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                            <h2 className="text-2xl font-black text-slate-900">Thank you!</h2>
                            <p className="text-slate-500 font-medium max-w-xs">
                                Your feedback has been sent directly to the team. We appreciate you letting us know.
                            </p>
                        </div>
                    )}
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
