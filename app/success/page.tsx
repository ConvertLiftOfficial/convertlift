"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"checking" | "ok" | "missing">("checking");

  useEffect(() => {
    let auditId = searchParams.get("audit_id");
    if (!auditId) {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith("convertlift_audit_")) {
          auditId = key.replace("convertlift_audit_", "");
          break;
        }
      }
    }
    
    if (!auditId) {
      setStatus("missing");
      return;
    }

    async function verifyPayment() {
      try {
        await fetch(`/api/verify-audit?audit_id=${auditId}`);
        setStatus("ok");
        const timeout = setTimeout(() => {
          router.replace(`/?audit_id=${encodeURIComponent(auditId as string)}`);
        }, 1100);
        return () => clearTimeout(timeout);
      } catch (err) {
        console.error("Verification check failed:", err);
        setStatus("ok");
        const timeout = setTimeout(() => {
          router.replace(`/?audit_id=${encodeURIComponent(auditId as string)}`);
        }, 1100);
        return () => clearTimeout(timeout);
      }
    }

    verifyPayment();
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-line bg-surface px-8 py-10">
        {status === "checking" && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-signal" />
            <div>
              <p className="font-display text-lg font-medium text-fg">Confirming payment</p>
              <p className="mt-1 text-sm text-fg-dim">Unlocking your full report...</p>
            </div>
          </>
        )}
        {status === "ok" && (
          <>
            <CheckCircle2 className="h-8 w-8 text-signal" />
            <div>
              <p className="font-display text-lg font-medium text-fg">Payment confirmed</p>
              <p className="mt-1 text-sm text-fg-dim">Taking you back to your full audit...</p>
            </div>
          </>
        )}
        {status === "missing" && (
          <div>
            <p className="font-display text-lg font-medium text-fg">We lost track of your audit</p>
            <p className="mt-1 text-sm text-fg-dim">
              Your payment went through, but we couldn't verify the active session. Click below to return.
            </p>
            <button
              onClick={() => router.replace("/")}
              className="focus-ring mt-4 rounded-lg border border-line bg-surface-raised px-4 py-2 text-sm font-medium transition-colors hover:border-signal/40"
            >
              Back to ConvertLift
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense 
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center">
          <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-line bg-surface px-8 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-signal" />
            <p className="font-display text-lg font-medium text-fg">Loading...</p>
          </div>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}