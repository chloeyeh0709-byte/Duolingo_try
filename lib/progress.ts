"use client";

import type { BookManifest } from "@/scripts/content-pipeline/types";

const STORAGE_KEY = "book-vocab-quest:progress:v1";
const STARTING_HEARTS = 5;
const XP_PER_CORRECT_ANSWER = 10;
const XP_LESSON_COMPLETE_BONUS = 20;

export interface WordMasteryEntry {
  correct: number;
  incorrect: number;
}

export interface SectionProgressEntry {
  completed: boolean;
  bestAccuracy: number;
}

export interface AppProgress {
  xp: number;
  streakCount: number;
  lastActiveDate: string | null;
  wordMastery: Record<string, WordMasteryEntry>;
  sections: Record<string, SectionProgressEntry>;
}

function emptyProgress(): AppProgress {
  return { xp: 0, streakCount: 0, lastActiveDate: null, wordMastery: {}, sections: {} };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadProgress(): AppProgress {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    return { ...emptyProgress(), ...JSON.parse(raw) };
  } catch {
    return emptyProgress();
  }
}

function saveProgress(progress: AppProgress): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  notifyProgressChange();
}

// --- external store plumbing, so components can use useSyncExternalStore
// instead of an effect + setState (avoids hydration mismatches on the
// localStorage-backed value). ---
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedSnapshot: AppProgress = emptyProgress();

function notifyProgressChange(): void {
  for (const listener of listeners) listener();
}

export function subscribeProgress(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window === "undefined") return () => listeners.delete(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) notifyProgressChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getProgressSnapshot(): AppProgress {
  if (typeof window === "undefined") return cachedSnapshot;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  cachedSnapshot = loadProgress();
  return cachedSnapshot;
}

const SERVER_SNAPSHOT: AppProgress = emptyProgress();

export function getServerProgressSnapshot(): AppProgress {
  return SERVER_SNAPSHOT;
}

/** Bumps the daily streak the first time this is called on a given calendar day. */
export function touchStreak(progress: AppProgress): AppProgress {
  const today = todayIso();
  if (progress.lastActiveDate === today) return progress;

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const isConsecutive = progress.lastActiveDate === yesterday;
  const next: AppProgress = {
    ...progress,
    streakCount: isConsecutive ? progress.streakCount + 1 : 1,
    lastActiveDate: today,
  };
  saveProgress(next);
  return next;
}

export function wordKey(bookSlug: string, lemma: string): string {
  return `${bookSlug}:${lemma}`;
}

export function sectionKey(bookSlug: string, partIndex: number, sectionIndex: number): string {
  return `${bookSlug}:${partIndex}:${sectionIndex}`;
}

export function recordAnswer(
  progress: AppProgress,
  bookSlug: string,
  lemma: string,
  correct: boolean
): AppProgress {
  const key = wordKey(bookSlug, lemma);
  const existing = progress.wordMastery[key] ?? { correct: 0, incorrect: 0 };
  const next: AppProgress = {
    ...progress,
    xp: progress.xp + (correct ? XP_PER_CORRECT_ANSWER : 0),
    wordMastery: {
      ...progress.wordMastery,
      [key]: {
        correct: existing.correct + (correct ? 1 : 0),
        incorrect: existing.incorrect + (correct ? 0 : 1),
      },
    },
  };
  saveProgress(next);
  return next;
}

export function completeSection(
  progress: AppProgress,
  bookSlug: string,
  partIndex: number,
  sectionIndex: number,
  accuracy: number
): AppProgress {
  const key = sectionKey(bookSlug, partIndex, sectionIndex);
  const existing = progress.sections[key];
  const next: AppProgress = {
    ...progress,
    xp: progress.xp + XP_LESSON_COMPLETE_BONUS,
    sections: {
      ...progress.sections,
      [key]: {
        completed: true,
        bestAccuracy: Math.max(existing?.bestAccuracy ?? 0, accuracy),
      },
    },
  };
  saveProgress(next);
  return touchStreak(next);
}

export function isSectionCompleted(
  progress: AppProgress,
  bookSlug: string,
  partIndex: number,
  sectionIndex: number
): boolean {
  return Boolean(progress.sections[sectionKey(bookSlug, partIndex, sectionIndex)]?.completed);
}

/** First section of the book is always unlocked; every other section unlocks once the previous one is completed. */
export function isSectionUnlocked(
  manifest: BookManifest,
  progress: AppProgress,
  partIndex: number,
  sectionIndex: number
): boolean {
  if (partIndex === 1 && sectionIndex === 1) return true;

  if (sectionIndex > 1) {
    return isSectionCompleted(progress, manifest.slug, partIndex, sectionIndex - 1);
  }

  const prevPart = manifest.parts.find((p) => p.index === partIndex - 1);
  if (!prevPart) return false;
  return isSectionCompleted(progress, manifest.slug, prevPart.index, prevPart.sectionCount);
}

export function isPartUnlocked(
  manifest: BookManifest,
  progress: AppProgress,
  partIndex: number
): boolean {
  return isSectionUnlocked(manifest, progress, partIndex, 1);
}

export function isPartCompleted(
  manifest: BookManifest,
  progress: AppProgress,
  partIndex: number
): boolean {
  const part = manifest.parts.find((p) => p.index === partIndex);
  if (!part) return false;
  for (let s = 1; s <= part.sectionCount; s++) {
    if (!isSectionCompleted(progress, manifest.slug, partIndex, s)) return false;
  }
  return true;
}

export const HEARTS = { starting: STARTING_HEARTS };
