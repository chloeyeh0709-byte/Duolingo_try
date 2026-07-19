/**
 * Step 1 of the content pipeline: unzip a book's epub, split it into parts
 * (chapters) and, within each part, into sections (either at a decorative
 * divider, or at each subheading, depending on the book's sectionSplitMode).
 * Output is plain paragraph text per section - no CEFR/exercise data yet.
 *
 * Usage: SMALL_FRY_EPUB_PATH=/path/to/book.epub npx tsx scripts/content-pipeline/extract-epub.ts small-fry
 */
import AdmZip from "adm-zip";
import * as cheerio from "cheerio";
import fs from "node:fs";
import path from "node:path";
import { getBookSource } from "./sources";
import type { BookSource, RawSection } from "./types";

function naturalPartNumber(filename: string, pattern: RegExp): number {
  const match = filename.match(pattern);
  return match?.[1] ? Number.parseInt(match[1], 10) : 0;
}

function extractSections(html: string, source: BookSource) {
  const $ = cheerio.load(html);
  const title = $(source.titleSelector).first().text().trim();

  const sections: string[][] = [[]];

  if (source.sectionSplitMode === "divider") {
    $("body")
      .find("p")
      .each((_, el) => {
        const node = $(el);
        if (node.is(source.sectionDividerSelector!)) {
          sections.push([]);
          return;
        }
        const text = node.text().replace(/\s+/g, " ").trim();
        if (text.length > 0) {
          sections[sections.length - 1].push(text);
        }
      });
  } else {
    $("body")
      .find(`p, ${source.sectionHeadingSelector}`)
      .each((_, el) => {
        const node = $(el);
        const text = node.text().replace(/\s+/g, " ").trim();
        if (text.length === 0) return;
        if (node.is(source.sectionHeadingSelector!)) {
          sections.push([text]);
        } else {
          sections[sections.length - 1].push(text);
        }
      });
  }

  return { title, sections: sections.filter((s) => s.length > 0) };
}

function run(bookSlug: string) {
  const source = getBookSource(bookSlug);
  if (!source.epubPath) {
    throw new Error(
      `No epub path configured for "${bookSlug}". Set the env var referenced in scripts/content-pipeline/sources.ts.`
    );
  }
  if (!fs.existsSync(source.epubPath)) {
    throw new Error(`Epub not found at ${source.epubPath}`);
  }

  const zip = new AdmZip(source.epubPath);
  const partEntries = zip
    .getEntries()
    .filter((entry) => source.partFilePattern.test(path.basename(entry.entryName)))
    .sort(
      (a, b) =>
        naturalPartNumber(path.basename(a.entryName), source.partFilePattern) -
        naturalPartNumber(path.basename(b.entryName), source.partFilePattern)
    );

  if (partEntries.length === 0) {
    throw new Error(`No part files matched ${source.partFilePattern} inside the epub.`);
  }

  const outDir = path.join("content", source.slug, "raw");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const partSummaries: { index: number; title: string; sectionCount: number }[] = [];

  partEntries.forEach((entry, partIdx0) => {
    const partIndex = partIdx0 + 1;
    const html = zip.readAsText(entry);
    const { title, sections } = extractSections(html, source);

    const partDir = path.join(outDir, `part-${partIndex}`);
    fs.mkdirSync(partDir, { recursive: true });

    sections.forEach((paragraphs, sectionIdx0) => {
      const sectionIndex = sectionIdx0 + 1;
      const raw: RawSection = {
        bookSlug: source.slug,
        partIndex,
        partTitle: title,
        sectionIndex,
        paragraphs,
      };
      fs.writeFileSync(
        path.join(partDir, `section-${sectionIndex}.json`),
        JSON.stringify(raw, null, 2)
      );
    });

    partSummaries.push({ index: partIndex, title, sectionCount: sections.length });
    console.log(`Part ${partIndex} "${title}": ${sections.length} sections`);
  });

  fs.writeFileSync(
    path.join("content", source.slug, "parts-summary.json"),
    JSON.stringify(partSummaries, null, 2)
  );
}

const bookSlug = process.argv[2];
if (!bookSlug) {
  console.error("Usage: npx tsx scripts/content-pipeline/extract-epub.ts <book-slug>");
  process.exit(1);
}
run(bookSlug);
