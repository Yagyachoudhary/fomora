import { Suspense } from "react";
import AnalyzeClient from "./AnalyzeClient";
import { BrandHeader } from "@/components/BrandHeader";
import { BottomNav } from "@/components/BottomNav";

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <>
          <BrandHeader />
          <main className="max-w-[1100px] mx-auto px-8 py-8">
            <div className="text-muted text-center py-16">Loading analyzer…</div>
          </main>
          <BottomNav />
        </>
      }
    >
      <AnalyzeClient />
    </Suspense>
  );
}
