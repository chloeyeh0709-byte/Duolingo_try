import type { WordEntry } from "@/scripts/content-pipeline/types";

const LEVEL_COLORS: Record<string, string> = {
  B2: "bg-duo-blue text-white",
  C1: "bg-duo-purple text-white",
  C2: "bg-duo-red text-white",
};

export default function WordFlashcard({ word }: { word: WordEntry }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border-2 border-b-4 border-duo-gray bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <h2 className="text-3xl font-extrabold">{word.lemma}</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${LEVEL_COLORS[word.level] ?? "bg-duo-gray"}`}
        >
          {word.level}
        </span>
      </div>
      <p className="text-lg font-semibold text-[color:var(--foreground)]">{word.definitionEn}</p>
      <p className="text-lg font-bold text-duo-green-dark">{word.translationZh}</p>
      <p className="rounded-2xl bg-duo-gray/30 p-3 text-sm italic leading-relaxed">
        “{word.exampleSentence}”
      </p>
    </div>
  );
}
