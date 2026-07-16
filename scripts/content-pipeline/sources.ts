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
    partFilePattern: /^part\d+\.html$/,
    titleSelector: "h1, h2",
    sectionDividerSelector: ".center-logo",
  },
];

export function getBookSource(slug: string): BookSource {
  const source = BOOK_SOURCES.find((b) => b.slug === slug);
  if (!source) {
    throw new Error(`Unknown book source: ${slug}`);
  }
  return source;
}
