/**
 * Step 3 of the content pipeline: look up every unique lemma from the
 * tokenized sections against an open CEFR-tagged wordlist
 * (see data/cefr-wordlist/SOURCES.md for provenance/license). Words found
 * in the wordlist get a level from A1-C2. Words *not* found are collected
 * into a single deduped list for AI-assisted classification (step 4).
 *
 * Usage: npx tsx scripts/content-pipeline/cefr-lookup.ts small-fry
 */
import fs from "node:fs";
import path from "node:path";
import { parseCsv } from "./csv";
import type { CefrLevel, TokenizedSection } from "./types";

const LEVEL_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

function loadWordlist(): Map<string, CefrLevel> {
  const map = new Map<string, CefrLevel>();
  const files = [
    "data/cefr-wordlist/cefrj-vocabulary-profile-1.5.csv",
    "data/cefr-wordlist/octanove-vocabulary-profile-c1c2-1.0.csv",
  ];

  for (const file of files) {
    const text = fs.readFileSync(file, "utf-8");
    const rows = parseCsv(text);
    const [header, ...body] = rows;
    const headwordIdx = header.indexOf("headword");
    const cefrIdx = header.indexOf("CEFR");

    for (const row of body) {
      const headwordField = row[headwordIdx];
      const level = row[cefrIdx] as CefrLevel;
      if (!headwordField || !LEVEL_ORDER.includes(level)) continue;

      // Some headwords list variants separated by "/", e.g. "a.m./A.M./am/AM".
      for (const variant of headwordField.split("/")) {
        const lemma = variant.trim().toLowerCase();
        if (!lemma || lemma.includes(" ")) continue; // skip multi-word phrases
        const existing = map.get(lemma);
        // Keep the *easiest* level found across POS entries, so a word with
        // both a common and a rare sense isn't over-flagged as advanced.
        if (!existing || LEVEL_ORDER.indexOf(level) < LEVEL_ORDER.indexOf(existing)) {
          map.set(lemma, level);
        }
      }
    }
  }

  return map;
}

function run(bookSlug: string) {
  const wordlist = loadWordlist();
  console.log(`Loaded ${wordlist.size} known words from the CEFR wordlist.`);

  const tokenizedDir = path.join("content", bookSlug, "tokenized");
  if (!fs.existsSync(tokenizedDir)) {
    throw new Error(`No tokenized content found at ${tokenizedDir}. Run tokenize.ts first.`);
  }

  const knownLevels: Record<string, CefrLevel> = {};
  const unknownFirstSeen = new Map<
    string,
    { sampleSentence: string; partIndex: number; sectionIndex: number }
  >();

  const partDirs = fs.readdirSync(tokenizedDir).filter((d) => d.startsWith("part-"));
  for (const partDir of partDirs) {
    const sectionFiles = fs
      .readdirSync(path.join(tokenizedDir, partDir))
      .filter((f) => f.endsWith(".json"));
    for (const sectionFile of sectionFiles) {
      const tokenized: TokenizedSection = JSON.parse(
        fs.readFileSync(path.join(tokenizedDir, partDir, sectionFile), "utf-8")
      );
      for (const { lemma, exampleSentence } of tokenized.lemmas) {
        const level = wordlist.get(lemma);
        if (level) {
          knownLevels[lemma] = level;
        } else if (!unknownFirstSeen.has(lemma)) {
          unknownFirstSeen.set(lemma, {
            sampleSentence: exampleSentence,
            partIndex: tokenized.partIndex,
            sectionIndex: tokenized.sectionIndex,
          });
        }
      }
    }
  }

  const outDir = path.join("content", bookSlug, "cefr");
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(outDir, "known-levels.json"),
    JSON.stringify(knownLevels, null, 2)
  );

  const unknownWords = Array.from(unknownFirstSeen.entries())
    .map(([lemma, info]) => ({ lemma, ...info }))
    .sort((a, b) => a.lemma.localeCompare(b.lemma));
  fs.writeFileSync(
    path.join(outDir, "unknown-words.json"),
    JSON.stringify(unknownWords, null, 2)
  );

  console.log(`Known (in wordlist): ${Object.keys(knownLevels).length} lemmas`);
  console.log(`Unknown (needs AI classification): ${unknownWords.length} lemmas`);
  const advancedKnown = Object.values(knownLevels).filter(
    (l) => LEVEL_ORDER.indexOf(l) > LEVEL_ORDER.indexOf("B1")
  ).length;
  console.log(`Of which known-and-above-B1: ${advancedKnown} lemmas`);
}

const bookSlug = process.argv[2];
if (!bookSlug) {
  console.error("Usage: npx tsx scripts/content-pipeline/cefr-lookup.ts <book-slug>");
  process.exit(1);
}
run(bookSlug);
