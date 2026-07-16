/**
 * Step 5 of the content pipeline: combine raw section text, tokenized
 * surface-form data, and the (wordlist + AI generated) word-content files
 * into final Lesson JSON files the app reads at request time, plus a
 * manifest.json (titles/counts only, no book text - this file IS committed
 * to git).
 *
 * Word-content files are expected at
 * content/<slug>/cefr/part-<p>-section-<s>-words.json (an array of objects
 * shaped like WordEntry minus surfaceForms/clozeAnswerSurfaceForm - those
 * two fields are computed here). Sections without such a file are skipped
 * (no lesson produced yet), but still counted in the manifest so the path
 * map shows the full course shape.
 *
 * Usage: npx tsx scripts/content-pipeline/build-lessons.ts small-fry
 */
import fs from "node:fs";
import path from "node:path";
import { getBookSource } from "./sources";
import type {
  BookManifest,
  Lesson,
  LessonExercise,
  RawSection,
  TokenizedSection,
  WordEntry,
} from "./types";

type GeneratedWord = Omit<WordEntry, "surfaceForms" | "clozeAnswerSurfaceForm">;

/** Caps how many words become flashcards/exercises in one sitting, so a lesson stays a few minutes long even when a section is vocabulary-dense. */
const MAX_PRACTICE_WORDS = 20;
const LEVEL_RANK: Record<string, number> = { C2: 0, C1: 1, B2: 2 };

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function stripPunctuation(token: string): string {
  return token.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, "");
}

/** Diffs exampleSentence vs. clozeSentence to recover the exact word that was blanked out. */
function findClozeAnswer(exampleSentence: string, clozeSentence: string, fallback: string): string {
  const exampleTokens = exampleSentence.split(/\s+/);
  const clozeTokens = clozeSentence.split(/\s+/);
  for (let i = 0; i < Math.min(exampleTokens.length, clozeTokens.length); i++) {
    if (clozeTokens[i].includes("_____")) {
      const answer = stripPunctuation(exampleTokens[i]);
      if (answer) return answer;
    }
  }
  return fallback;
}

function buildExercisesForWord(
  word: WordEntry,
  allWords: WordEntry[],
  type: LessonExercise["type"]
): LessonExercise {
  if (type === "multiple-choice") {
    return {
      type,
      wordLemma: word.lemma,
      prompt: word.lemma,
      options: shuffle([word.definitionEn, ...word.distractors]),
      answer: word.definitionEn,
    };
  }

  if (type === "cloze") {
    const others = shuffle(allWords.filter((w) => w.lemma !== word.lemma)).slice(0, 3);
    const options = shuffle([word.clozeAnswerSurfaceForm, ...others.map((w) => w.clozeAnswerSurfaceForm)]);
    return {
      type,
      wordLemma: word.lemma,
      prompt: word.clozeSentence,
      options,
      answer: word.clozeAnswerSurfaceForm,
    };
  }

  const others = shuffle(allWords.filter((w) => w.lemma !== word.lemma)).slice(0, 3);
  return {
    type: "translation",
    wordLemma: word.lemma,
    prompt: word.translationZh,
    options: shuffle([word.lemma, ...others.map((w) => w.lemma)]),
    answer: word.lemma,
  };
}

function buildLesson(
  bookSlug: string,
  partIndex: number,
  partTitle: string,
  sectionIndex: number
): Lesson | null {
  const rawPath = path.join("content", bookSlug, "raw", `part-${partIndex}`, `section-${sectionIndex}.json`);
  const tokenizedPath = path.join(
    "content",
    bookSlug,
    "tokenized",
    `part-${partIndex}`,
    `section-${sectionIndex}.json`
  );
  const wordsPath = path.join(
    "content",
    bookSlug,
    "cefr",
    `part-${partIndex}-section-${sectionIndex}-words.json`
  );

  if (!fs.existsSync(wordsPath)) return null;

  const raw: RawSection = JSON.parse(fs.readFileSync(rawPath, "utf-8"));
  const tokenized: TokenizedSection = JSON.parse(fs.readFileSync(tokenizedPath, "utf-8"));
  const generatedWords: GeneratedWord[] = JSON.parse(fs.readFileSync(wordsPath, "utf-8"));

  const surfaceFormsByLemma = new Map(tokenized.lemmas.map((l) => [l.lemma, l.surfaceForms]));
  const fullText = raw.paragraphs.join(" ");

  const words: WordEntry[] = generatedWords.map((w) => ({
    ...w,
    surfaceForms: surfaceFormsByLemma.get(w.lemma) ?? [w.lemma],
    clozeAnswerSurfaceForm: findClozeAnswer(w.exampleSentence, w.clozeSentence, w.lemma),
  }));

  const readingOrderIndex = (word: WordEntry): number => {
    const i = fullText.indexOf(word.exampleSentence.split(/\s+/)[0]);
    return i === -1 ? Infinity : i;
  };

  words.sort((a, b) => readingOrderIndex(a) - readingOrderIndex(b));

  const practiceWords = [...words]
    .sort((a, b) => {
      const levelDiff = (LEVEL_RANK[a.level] ?? 3) - (LEVEL_RANK[b.level] ?? 3);
      if (levelDiff !== 0) return levelDiff;
      return readingOrderIndex(a) - readingOrderIndex(b);
    })
    .slice(0, MAX_PRACTICE_WORDS)
    .sort((a, b) => readingOrderIndex(a) - readingOrderIndex(b));

  const exerciseTypes: LessonExercise["type"][] = ["multiple-choice", "cloze", "translation"];
  const exercises = shuffle(
    practiceWords.map((word, i) =>
      buildExercisesForWord(word, practiceWords, exerciseTypes[i % exerciseTypes.length])
    )
  );

  return {
    bookSlug,
    partIndex,
    partTitle,
    sectionIndex,
    paragraphs: raw.paragraphs,
    words,
    practiceWords,
    exercises,
  };
}

function run(bookSlug: string) {
  const source = getBookSource(bookSlug);
  const summaryPath = path.join("content", bookSlug, "parts-summary.json");
  const partsSummary: { index: number; title: string; sectionCount: number }[] = JSON.parse(
    fs.readFileSync(summaryPath, "utf-8")
  );

  const lessonsOutDir = path.join("content", bookSlug, "lessons");
  fs.mkdirSync(lessonsOutDir, { recursive: true });

  const manifestParts: BookManifest["parts"] = [];

  for (const part of partsSummary) {
    let wordCount = 0;
    const partOutDir = path.join(lessonsOutDir, `part-${part.index}`);
    fs.mkdirSync(partOutDir, { recursive: true });

    for (let sectionIndex = 1; sectionIndex <= part.sectionCount; sectionIndex++) {
      const lesson = buildLesson(bookSlug, part.index, part.title, sectionIndex);
      if (!lesson) continue;
      wordCount += lesson.words.length;
      fs.writeFileSync(
        path.join(partOutDir, `section-${sectionIndex}.json`),
        JSON.stringify(lesson, null, 2)
      );
      console.log(
        `Built lesson part-${part.index}/section-${sectionIndex}: ${lesson.words.length} words, ${lesson.exercises.length} exercises`
      );
    }

    manifestParts.push({
      index: part.index,
      title: part.title,
      sectionCount: part.sectionCount,
      wordCount,
    });
  }

  const manifest: BookManifest = {
    slug: source.slug,
    title: source.title,
    author: source.author,
    parts: manifestParts,
  };
  fs.writeFileSync(path.join("content", bookSlug, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\nWrote manifest.json for "${manifest.title}" (${manifestParts.length} parts).`);
}

const bookSlug = process.argv[2];
if (!bookSlug) {
  console.error("Usage: npx tsx scripts/content-pipeline/build-lessons.ts <book-slug>");
  process.exit(1);
}
run(bookSlug);
