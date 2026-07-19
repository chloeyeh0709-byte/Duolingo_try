"use client";

import Link from "next/link";

export default function ResultsSummary({
  correctCount,
  totalCount,
  xpEarned,
  missedWords,
  nextHref,
  bookHref,
  nextGroupLabel,
  onNextGroup,
}: {
  correctCount: number;
  totalCount: number;
  xpEarned: number;
  missedWords: string[];
  nextHref: string | null;
  bookHref: string;
  nextGroupLabel?: string;
  onNextGroup?: () => void;
}) {
  const accuracy = totalCount === 0 ? 100 : Math.round((correctCount / totalCount) * 100);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="text-6xl">🎉</p>
      <h1 className="text-3xl font-extrabold text-duo-green-dark">
        {nextGroupLabel ? "本組完成！" : "課程完成！"}
      </h1>
      <div className="flex gap-8">
        <div>
          <p className="text-3xl font-extrabold text-duo-yellow-dark">+{xpEarned}</p>
          <p className="text-sm font-bold text-duo-gray-dark">經驗值 XP</p>
        </div>
        <div>
          <p className="text-3xl font-extrabold text-duo-blue-dark">{accuracy}%</p>
          <p className="text-sm font-bold text-duo-gray-dark">答對率</p>
        </div>
      </div>

      {missedWords.length > 0 && (
        <div className="w-full max-w-sm rounded-2xl bg-duo-red/10 p-4 text-left">
          <p className="mb-2 text-sm font-extrabold text-duo-red-dark">需要複習的單字</p>
          <p className="text-sm font-semibold">{missedWords.join("、")}</p>
        </div>
      )}

      <div className="flex w-full max-w-sm flex-col gap-3">
        {onNextGroup && nextGroupLabel && (
          <button
            type="button"
            onClick={onNextGroup}
            className="rounded-2xl border-b-4 border-duo-green-dark bg-duo-green py-3 text-center font-extrabold text-white active:translate-y-1 active:border-b-0"
          >
            {nextGroupLabel} →
          </button>
        )}
        {nextHref && (
          <Link
            href={nextHref}
            className="rounded-2xl border-b-4 border-duo-green-dark bg-duo-green py-3 text-center font-extrabold text-white active:translate-y-1 active:border-b-0"
          >
            繼續下一課
          </Link>
        )}
        <Link
          href={bookHref}
          className="rounded-2xl border-2 border-b-4 border-duo-gray py-3 text-center font-extrabold text-[color:var(--foreground)] active:translate-y-1 active:border-b-0"
        >
          回到課程地圖
        </Link>
      </div>
    </div>
  );
}
