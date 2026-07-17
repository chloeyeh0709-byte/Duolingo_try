import type { BookManifest, Lesson } from "../scripts/content-pipeline/types";
import { lessons, manifests } from "./content-data";

export function listBookManifests(): BookManifest[] {
  return manifests;
}

export function getBookManifest(slug: string): BookManifest | null {
  return manifests.find((m) => m.slug === slug) ?? null;
}

export function getLesson(slug: string, partIndex: number, sectionIndex: number): Lesson | null {
  return lessons[`${slug}:${partIndex}:${sectionIndex}`] ?? null;
}
