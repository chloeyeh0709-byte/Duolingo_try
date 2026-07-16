"use client";

import Link from "next/link";
import { useProgress } from "@/lib/useProgress";

export default function TopStatusBar() {
  const progress = useProgress();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-duo-gray bg-white/95 px-4 py-3 backdrop-blur">
      <Link href="/" className="text-xl font-extrabold text-duo-green-dark">
        字彙冒險
      </Link>
      <div className="flex items-center gap-4 text-sm font-bold">
        <span className="flex items-center gap-1 text-duo-yellow-dark">🔥 {progress.streakCount}</span>
        <span className="flex items-center gap-1 text-duo-blue-dark">⭐ {progress.xp} XP</span>
      </div>
    </header>
  );
}
