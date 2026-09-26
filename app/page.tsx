"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  Lock,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import type { AuditPoint, AuditResponse } from "@/lib/types";

type ViewState = "idle" | "loading" | "error" | "result";

const LOADING_STEPS = [
  "Parsing content and visual hierarchy…",
  "Benchmarking against AIDA & PAS frameworks…",
  "Synthesizing psychological friction points…",
];

function severityStyles(severity: string) {
  if (severity === "High") {
    return { text: "text-high", bg: "bg-high-soft", border: "border-high/30" };
  }
  return { text: "text-med", bg: "bg-med-soft", border: "border-med/30" };
}

function AuditCard({ point, index }: { point: AuditPoint; index: number }) {
  const [tab, setTab] = useState<"problem" | "rewrite">("problem");
  const s = severityStyles(point.severity);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3) }}
      className="relative pl-12"
    >
      <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface font-mono text-xs text-fg-dim">
        {String(point.id).padStart(2, "0")}
      </div>
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] tracking-wide text-fg-faint">
            {point.category}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${s.text} ${s.bg} ${s.border}`}
          >
            {point.severity === "High" ? "high impact" : "medium impact"}
          </span>
        </div>

        <div className="mb-4 flex gap-1 rounded-lg bg-surface-raised p-1 text-sm">
          <button
            onClick={() => setTab("problem")}
            className={`focus-ring flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
              tab === "problem" ? "bg-ink text-fg" : "text-fg-dim hover:text-fg"
            }`}
          >
            The Problem
          </button>
          <button
            onClick={() => setTab("rewrite")}
            className={`focus-ring flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
              tab === "rewrite" ? "bg-ink text-fg" : "text-fg-dim hover:text-fg"
            }`}
          >
            The Exact Rewrite
          </button>
        </div>

        {tab === "problem" ? (
          <div className="space-y-2.5">
            <p className="text-[15px] leading-relaxed text-fg">{point.issue}</p>
            <p className="text-sm leading-relaxed text-fg-dim">{point.why_it_hurts}</p>
          </div>
        ) : (
          <p className="rounded-lg border border-signal/20 bg-signal-soft/40 px-4 py-3 text-[15px] leading-relaxed text-fg">
            {point.exact_rewrite}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();

  const [input, setInput] = useState("");
  const [view, setView] = useState<ViewState>("idle");
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AuditResponse | null>(null);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    const idFromUrl = searchParams.get("audit_id");
    if (!idFromUrl) return;

    const stored = sessionStorage.getItem(`convertlift_audit_${idFromUrl}`);
    if (stored) {
      const parsed = JSON.parse(stored) as AuditResponse;
      setResult(parsed);
      setAuditId(idFromUrl);
      setView("result");
    }

    async function verifyPayment() {
      try {
        const res = await fetch(`/api/verify-audit?audit_id=${idFromUrl}`);
        const data = await res.json();
        if (data.unlocked) {
          setUnlocked(true);
        }
      } catch (error) {
        console.error("Verification failed:", error);
      }
    }
    verifyPayment();
  }, [searchParams]);

  useEffect(() => {
    if (view !== "loading") return;
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 900);
    return () => clearInterval(interval);
  }, [view]);

  const runAudit = useCallback(async () => {
    if (!input.trim()) return;
    setView("loading");
    setErrorMsg("");
    setUnlocked(false);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg("Failed to generate the audit properly. The AI returned an invalid format. Please try running the audit again.");
        setView("error");
        return;
      }

      const newAuditId = crypto.randomUUID();
      sessionStorage.setItem(`convertlift_audit_${newAuditId}`, JSON.stringify(data));
      setResult(data as AuditResponse);
      setAuditId(newAuditId);
      setView("result");
    } catch {
      setErrorMsg("Couldn't reach the audit engine. Check your connection and try again.");
      setView("error");
    }
  }, [input]);

  const startCheckout = useCallback(async () => {
    if (!auditId) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setErrorMsg("Couldn't start checkout. Please try again.");
        setCheckoutLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setErrorMsg("Couldn't start checkout. Please try again.");
      setCheckoutLoading(false);
    }
  }, [auditId]);

  const freePoints = useMemo(() => {
    const points = result?.points ?? [];
    return unlocked ? points : points.slice(0, 2);
  }, [result, unlocked]);

  const lockedPoints = useMemo(() => {
    const points = result?.points ?? [];
    return unlocked ? [] : points.slice(2);
  }, [result, unlocked]);

  const highCount = useMemo(() => {
    return result?.points?.filter((p) => p.severity === "High").length ?? 0;
  }, [result]);

  return (
    <main className="min-h-screen bg-ink">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-10%] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-signal/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex max-w-2xl flex-col px-6 pb-24 pt-16 sm:pt-24">
        <header className="mb-14 flex items-center justify-between">
  <div className="flex items-center gap-2.5">
    <img 
      src="/logo.png" 
      alt="ConvertLift Logo" 
      className="h-7 w-7 rounded-md object-contain" 
    />
    <span className="font-display text-[15px] font-semibold text-fg">ConvertLift</span>
  </div>
  <span className="font-mono text-xs text-fg-faint">10-point diagnostic</span>
</header>

        <AnimatePresence mode="wait">
          {view !== "result" && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="font-display text-[2.6rem] font-medium leading-[1.08] tracking-tight text-fg sm:text-[3.2rem]">
                Get a $1,000 copy audit in 5 seconds.
              </h1>
              <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-fg-dim">
                Paste your landing page URL or cold email text. Get two instant diagnostic
                teardowns for free, and unlock the full 10-point conversion report for less
                than a cup of coffee.
              </p>

              <div className="mt-9">
                <div className="focus-within:border-signal/60 rounded-xl border border-line bg-surface p-1.5 transition-colors">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste your landing page URL, sales copy, or cold email here…"
                    rows={5}
                    className="focus-ring w-full resize-none rounded-lg bg-transparent px-4 py-3 text-[15px] leading-relaxed text-fg placeholder:text-fg-faint"
                  />
                  <div className="flex items-center justify-between px-3 pb-2 pt-1">
                    <span className="font-mono text-[11px] text-fg-faint">
                      {input.length.toLocaleString()} / 12,000
                    </span>
                    <button
                      onClick={runAudit}
                      disabled={!input.trim() || view === "loading"}
                      className="focus-ring group inline-flex items-center gap-2 rounded-lg bg-signal px-5 py-2.5 text-sm font-semibold text-ink transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Run Instant Audit
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        strokeWidth={2.5}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {view === "loading" && (
                <div className="mt-8 space-y-3 rounded-xl border border-line bg-surface p-5">
                  {LOADING_STEPS.map((step, i) => (
                    <div key={step} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                        {i < loadingStep ? (
                          <Check className="h-4 w-4 text-signal" strokeWidth={2.5} />
                        ) : i === loadingStep ? (
                          <div className="h-2 w-2 animate-pulse-soft rounded-full bg-signal" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-line" />
                        )}
                      </div>
                      <span
                        className={`font-mono text-[13px] ${
                          i <= loadingStep ? "text-fg-dim" : "text-fg-faint"
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {view === "error" && (
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-high/30 bg-high-soft/50 p-4">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-high" strokeWidth={2} />
                  <p className="text-sm text-fg">{errorMsg}</p>
                </div>
              )}

              <div className="mt-12 flex items-center gap-6 text-xs text-fg-faint">
                <span>No signup required</span>
                <span className="h-1 w-1 rounded-full bg-line" />
                <span>2 critiques free</span>
                <span className="h-1 w-1 rounded-full bg-line" />
                <span>Full report — $2.99</span>
              </div>
            </motion.div>
          )}

          {view === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <button
                onClick={() => {
                  setView("idle");
                  setResult(null);
                  setInput("");
                }}
                className="focus-ring mb-6 text-sm text-fg-dim transition-colors hover:text-fg"
              >
                ← New audit
              </button>

              <h2 className="font-display text-2xl font-medium text-fg">Your audit is in</h2>
              <p className="mt-2 text-[15px] text-fg-dim">{result.input_summary}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] text-fg-dim">
                  10 findings
                </span>
                <span className="rounded-full border border-high/30 bg-high-soft px-3 py-1 font-mono text-[11px] text-high">
                  {highCount} high impact
                </span>
                {unlocked && (
                  <span className="rounded-full border border-signal/30 bg-signal-soft px-3 py-1 font-mono text-[11px] text-signal">
                    full report unlocked
                  </span>
                )}
              </div>

              <div className="my-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    const pointsArray = result?.points || [];
                    const combinedCopy = pointsArray
                      ?.map((p: any) => p?.exact_rewrite)
                      .filter(Boolean)
                      .join("\n\n");

                    if (combinedCopy && combinedCopy.trim().length > 0) {
                      navigator.clipboard.writeText(combinedCopy);
                      alert("✨ Copy All Exact Rewrites copied to clipboard!");
                    } else {
                      alert("⚠️ No rewrite points found.");
                    }
                  }}
                  className="focus-ring inline-flex items-center gap-2 rounded-lg border border-line bg-surface-raised px-3.5 py-2 text-sm font-medium text-fg transition-colors hover:border-signal/40"
                >
                  <span>✨</span>
                  <span>Copy All Exact Rewrites</span>
                </button>
              </div>

              <div className="report-rail relative mt-10 space-y-6 pl-[1px]">
                {freePoints.map((point: any, index: number) => (
                  <AuditCard key={point.id || index} point={point} index={index} />
                ))}

                {unlocked ? (
                  lockedPoints.map((point, i) => (
                    <AuditCard key={point.id} point={point} index={i + 2} />
                  ))
                ) : (
                  <div className="relative pl-12">
                    <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface">
                      <Lock className="h-3.5 w-3.5 text-fg-faint" strokeWidth={2} />
                    </div>
                    <div className="relative overflow-hidden rounded-xl border border-line bg-surface">
                      <div className="space-y-4 p-5 opacity-40 blur-sm">
                        {lockedPoints.slice(0, 3).map((point) => (
                          <div key={point.id} className="rounded-lg border border-line p-4">
                            <div className="mb-2 h-3 w-24 rounded bg-line" />
                            <div className="mb-1.5 h-3 w-full rounded bg-line" />
                            <div className="h-3 w-3/4 rounded bg-line" />
                          </div>
                        ))}
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-surface/40 via-surface/85 to-surface px-6 text-center">
                        <div>
                          <p className="font-display text-lg font-medium text-fg">
                            8 more findings, locked
                          </p>
                          <p className="mx-auto mt-1.5 max-w-xs text-sm text-fg-dim">
                            Unlock the full 10-point breakdown, psychological analysis, and
                            exact copy rewrites.
                          </p>
                        </div>
                        <button
                          onClick={startCheckout}
                          disabled={checkoutLoading}
                          className="focus-ring inline-flex items-center gap-2 rounded-lg bg-signal px-6 py-3 text-sm font-semibold text-ink transition-all hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
                        >
                          {checkoutLoading ? "Opening checkout…" : "Unlock Full Audit — $2.99"}
                        </button>
                        <span className="font-mono text-[11px] text-fg-faint">
                          Secure checkout via Lemon Squeezy · instant delivery
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-high/30 bg-high-soft/50 p-4">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-high" strokeWidth={2} />
                  <p className="text-sm text-fg">{errorMsg}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 10X PRINT-ONLY EXECUTIVE REPORT */}
        <div className="hidden print:block bg-white text-black p-8 font-sans">
          <div className="border-b border-gray-300 pb-6 mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">ConvertLift Executive Diagnostic Report</h1>
              <p className="text-sm text-gray-600 mt-1">AI-Powered Conversion Audit & Copywriting Rewrite Plan</p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>Generated by ConvertLift</p>
              <p>Status: Unlocked Full Report</p>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-lg font-bold mb-4 border-l-4 border-black pl-3 uppercase tracking-wider text-black">
              Part 1: The Executive Copywriter's Cheat Sheet (Quick-Win Rewrites)
            </h2>
            <p className="text-xs text-gray-600 mb-4">
              Instant solutions. Replace your current copy with these psychologically optimized rewrites for immediate conversion lift.
            </p>
            
            <div className="space-y-4">
              {result?.points?.map((point, index) => (
                <div key={index} className="border border-gray-300 rounded p-4 bg-gray-50 break-inside-avoid">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-xs uppercase tracking-wide text-gray-700">
                      #{index + 1} — {point.category}
                    </span>
                    <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded font-semibold">
                      {point.severity} Impact
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs mt-2">
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <span className="block font-semibold text-red-600 mb-1">The Flaw / Problem:</span>
                      <p className="text-gray-700">{point.issue}</p>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded border border-emerald-200">
                      <span className="block font-semibold text-emerald-700 mb-1">The Exact Rewrite:</span>
                      <p className="text-gray-900 font-medium">{point.exact_rewrite}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div> 

      </div> 
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}