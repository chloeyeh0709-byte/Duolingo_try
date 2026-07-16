"use client";

import { useMemo, useState } from "react";
import type { WordEntry } from "@/scripts/content-pipeline/types";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildHighlighter(words: WordEntry[]) {
  const surfaceToLemma = new Map<string, string>();
  for (const word of words) {
    for (const form of word.surfaceForms) {
      surfaceToLemma.set(form.toLowerCase(), word.lemma);
    }
  }
  const forms = Array.from(surfaceToLemma.keys()).sort((a, b) => b.length - a.length);
  const pattern = forms.length > 0 ? new RegExp(`\\b(${forms.map(escapeRegExp).join("|")})\\b`, "gi") : null;
  return { pattern, surfaceToLemma };
}

export default function ReadingMode({
  paragraphs,
  words,
  onDone,
}: {
  paragraphs: string[];
  words: WordEntry[];
  onDone: () => void;
}) {
  const [activeLemma, setActiveLemma] = useState<string | null>(null);
  const { pattern, surfaceToLemma } = useMemo(() => buildHighlighter(words), [words]);
  const wordByLemma = useMemo(() => new Map(words.map((w) => [w.lemma, w])), [words]);
  const activeWord = activeLemma ? wordByLemma.get(activeLemma) : null;

  const renderParagraph = (paragraph: string, pIdx: number) => {
    if (!pattern) return <p key={pIdx}>{paragraph}</p>;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let key = 0;
    for (const match of paragraph.matchAll(pattern)) {
      if (match.index === undefined) continue;
      if (match.index > lastIndex) {
        parts.push(paragraph.slice(lastIndex, match.index));
      }
      const lemma = surfaceToLemma.get(match[0].toLowerCase())!;
      parts.push(
        <button
          key={key++}
          type="button"
          onClick={() => setActiveLemma(lemma)}
          className="rounded bg-duo-yellow/40 px-0.5 font-bold underline decoration-duo-yellow-dark decoration-2 underline-offset-2"
        >
          {match[0]}
        </button>
      );
      lastIndex = match.index + match[0].length;
    }
    parts.push(paragraph.slice(lastIndex));
    return <p key={pIdx}>{parts}</p>;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 text-lg leading-relaxed">
        {paragraphs.map(renderParagraph)}
      </div>

      {activeWord && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-duo-gray bg-white p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex max-w-md items-start justify-between gap-4">
            <div>
              <p className="text-xl font-extrabold">{activeWord.lemma}</p>
              <p className="text-sm font-semibold">{activeWord.definitionEn}</p>
              <p className="text-sm font-bold text-duo-green-dark">{activeWord.translationZh}</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveLemma(null)}
              className="rounded-full bg-duo-gray/50 px-3 py-1 text-sm font-bold"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onDone}
        className="rounded-2xl border-b-4 border-duo-green-dark bg-duo-green py-3 text-center font-extrabold text-white active:translate-y-1 active:border-b-0"
      >
        讀完了，開始學生字 →
      </button>
    </div>
  );
}
