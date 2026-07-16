export interface BookSource {
  /** URL-safe id used for content/<slug> and app/book/<slug> routes. */
  slug: string;
  title: string;
  author: string;
  /** Path to the source .epub file (not committed to git). */
  epubPath: string;
  /**
   * Matches the epub-internal file names (basename only) that make up the
   * book's main chapters/parts, in the order they should be read. Front
   * matter (title page, copyright, dedication, acknowledgements, ...) and
   * back matter are excluded by not matching this pattern.
   */
  partFilePattern: RegExp;
  /** CSS selector, relative to the part file's body, for the part title heading. */
  titleSelector: string;
  /**
   * CSS selector for elements that mark a section break within a part
   * (e.g. a decorative divider image between vignettes). Each divider
   * starts a new section; content before the first divider is section 1.
   */
  sectionDividerSelector: string;
}

export interface RawSection {
  bookSlug: string;
  partIndex: number;
  partTitle: string;
  sectionIndex: number;
  paragraphs: string[];
}

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface LemmaOccurrence {
  lemma: string;
  surfaceForms: string[];
  count: number;
  /** One representative sentence from the section containing this lemma. */
  exampleSentence: string;
  /** The exact inflected form of the word as it appears in exampleSentence, for cloze blanking. */
  exampleSurfaceForm: string;
}

export interface TokenizedSection {
  bookSlug: string;
  partIndex: number;
  sectionIndex: number;
  lemmas: LemmaOccurrence[];
}

export interface WordEntry {
  lemma: string;
  level: CefrLevel;
  levelSource: "wordlist" | "ai";
  definitionEn: string;
  translationZh: string;
  exampleSentence: string;
  clozeSentence: string;
  /** The exact word (its surface form) blanked out in clozeSentence, used to grade cloze answers. */
  clozeAnswerSurfaceForm: string;
  distractors: string[];
  /** All inflected forms of this lemma seen in the section's text, for reading-mode highlighting. */
  surfaceForms: string[];
}

export interface LessonExercise {
  type: "multiple-choice" | "cloze" | "translation";
  wordLemma: string;
  prompt: string;
  options?: string[];
  answer: string;
}

export interface Lesson {
  bookSlug: string;
  partIndex: number;
  partTitle: string;
  sectionIndex: number;
  paragraphs: string[];
  /** Every CEFR B2+ word found in this section - used for reading-mode highlighting. */
  words: WordEntry[];
  /** A capped, level-prioritized subset of `words` used for flashcards + exercises, so a lesson stays a few minutes long even for vocabulary-dense sections. */
  practiceWords: WordEntry[];
  exercises: LessonExercise[];
}

export interface BookManifest {
  slug: string;
  title: string;
  author: string;
  parts: {
    index: number;
    title: string;
    sectionCount: number;
    wordCount: number;
  }[];
}
