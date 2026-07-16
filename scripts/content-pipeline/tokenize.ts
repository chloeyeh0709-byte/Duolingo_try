/**
 * Step 2 of the content pipeline: read the raw section text produced by
 * extract-epub.ts, split into sentences, tokenize + lemmatize every word,
 * and record one example sentence per lemma. Likely proper nouns (names,
 * places) are filtered out since they aren't general vocabulary.
 *
 * Usage: npx tsx scripts/content-pipeline/tokenize.ts small-fry
 */
import lemmatizer from "wink-lemmatizer";
import fs from "node:fs";
import path from "node:path";
import type { LemmaOccurrence, RawSection, TokenizedSection } from "./types";

const WORD_RE = /[A-Za-z][A-Za-z'’-]*/g;
const SENTENCE_SPLIT_RE = /(?<=[.!?])\s+(?=[A-Z"'‘“”])/;

function splitSentences(paragraph: string): string[] {
  return paragraph
    .split(SENTENCE_SPLIT_RE)
    .map((s) => s.trim())
    .filter(Boolean);
}

function lemmatize(word: string): string {
  const lower = word.toLowerCase();
  const verb = lemmatizer.verb(lower);
  if (verb !== lower) return verb;
  const noun = lemmatizer.noun(lower);
  if (noun !== lower) return noun;
  const adj = lemmatizer.adjective(lower);
  if (adj !== lower) return adj;
  return lower;
}

interface TokenObservation {
  surfaceForm: string;
  sentence: string;
  capitalizedNonInitial: boolean;
  lowercaseSeen: boolean;
}

function tokenizeSection(raw: RawSection): TokenizedSection {
  const byLemma = new Map<string, TokenObservation[]>();

  for (const paragraph of raw.paragraphs) {
    const sentences = splitSentences(paragraph);
    for (const sentence of sentences) {
      let match: RegExpExecArray | null;
      WORD_RE.lastIndex = 0;
      let isFirstWord = true;
      while ((match = WORD_RE.exec(sentence)) !== null) {
        const surfaceForm = match[0];
        const isCapitalized = /^[A-Z]/.test(surfaceForm);
        const observation: TokenObservation = {
          surfaceForm,
          sentence,
          capitalizedNonInitial: isCapitalized && !isFirstWord,
          lowercaseSeen: !isCapitalized,
        };
        const lemma = lemmatize(surfaceForm);
        if (!byLemma.has(lemma)) byLemma.set(lemma, []);
        byLemma.get(lemma)!.push(observation);
        isFirstWord = false;
      }
    }
  }

  const lemmas: LemmaOccurrence[] = [];
  for (const [lemma, observations] of byLemma) {
    if (lemma.length <= 1) continue;
    if (!/[a-z]/.test(lemma)) continue;

    // Treat as a likely proper noun if it is *never* seen lowercase and
    // *never* seen capitalized outside of sentence-initial position is false
    // -> i.e. it's always capitalized even mid-sentence, and never lowercase.
    const everLowercase = observations.some((o) => o.lowercaseSeen);
    const everCapitalizedMidSentence = observations.some((o) => o.capitalizedNonInitial);
    const likelyProperNoun = !everLowercase && everCapitalizedMidSentence;
    if (likelyProperNoun) continue;

    const first = observations[0];
    lemmas.push({
      lemma,
      surfaceForms: Array.from(new Set(observations.map((o) => o.surfaceForm.toLowerCase()))),
      count: observations.length,
      exampleSentence: first.sentence,
      exampleSurfaceForm: first.surfaceForm,
    });
  }

  lemmas.sort((a, b) => a.lemma.localeCompare(b.lemma));

  return {
    bookSlug: raw.bookSlug,
    partIndex: raw.partIndex,
    sectionIndex: raw.sectionIndex,
    lemmas,
  };
}

function run(bookSlug: string) {
  const rawDir = path.join("content", bookSlug, "raw");
  if (!fs.existsSync(rawDir)) {
    throw new Error(`No raw content found at ${rawDir}. Run extract-epub.ts first.`);
  }
  const outDir = path.join("content", bookSlug, "tokenized");
  fs.rmSync(outDir, { recursive: true, force: true });

  const partDirs = fs.readdirSync(rawDir).filter((d) => d.startsWith("part-"));
  for (const partDir of partDirs) {
    const sectionFiles = fs
      .readdirSync(path.join(rawDir, partDir))
      .filter((f) => f.endsWith(".json"));
    const outPartDir = path.join(outDir, partDir);
    fs.mkdirSync(outPartDir, { recursive: true });

    for (const sectionFile of sectionFiles) {
      const raw: RawSection = JSON.parse(
        fs.readFileSync(path.join(rawDir, partDir, sectionFile), "utf-8")
      );
      const tokenized = tokenizeSection(raw);
      fs.writeFileSync(
        path.join(outPartDir, sectionFile),
        JSON.stringify(tokenized, null, 2)
      );
      console.log(
        `${partDir}/${sectionFile}: ${tokenized.lemmas.length} unique lemmas`
      );
    }
  }
}

const bookSlug = process.argv[2];
if (!bookSlug) {
  console.error("Usage: npx tsx scripts/content-pipeline/tokenize.ts <book-slug>");
  process.exit(1);
}
run(bookSlug);
