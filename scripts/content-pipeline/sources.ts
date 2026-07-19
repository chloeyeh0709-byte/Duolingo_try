import type { BookSource } from "./types";

/**
 * Registry of books the content pipeline knows how to process. To add a new
 * book: drop its .epub somewhere local (never commit it), add an entry here
 * describing how to find its parts/sections, then run the pipeline scripts
 * in order (extract -> tokenize -> cefr-lookup -> [AI fill-in] -> build-lessons).
 */
export const BOOK_SOURCES: BookSource[] = [
  {
    slug: "small-fry",
    title: "Small Fry",
    author: "Lisa Brennan-Jobs",
    epubPath: process.env.SMALL_FRY_EPUB_PATH ?? "",
    partFilePattern: /^part(\d+)\.html$/,
    titleSelector: "h1, h2",
    sectionSplitMode: "divider",
    sectionDividerSelector: ".center-logo",
  },
  {
    slug: "zero-to-one",
    title: "Zero to One",
    author: "Peter Thiel with Blake Masters",
    epubPath: process.env.ZERO_TO_ONE_EPUB_PATH ?? "",
    partFilePattern: /^Thie_9780804139304_epub_c(\d+)_r1\.htm$/,
    titleSelector: "h1.chapter_title",
    sectionSplitMode: "heading",
    sectionHeadingSelector: "h2.A_Head",
  },
];

export function getBookSource(slug: string): BookSource {
  const source = BOOK_SOURCES.find((b) => b.slug === slug);
  if (!source) {
    throw new Error(`Unknown book source: ${slug}`);
  }
  return source;
}
