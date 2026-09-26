import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import SuccessClientView from "./SuccessClientView";

export const dynamic = 'force-dynamic';

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
      <SuccessClientView />
    </Suspense>
  );
}