import fs from "node:fs";
import path from "node:path";
import type { BookManifest, Lesson } from "@/scripts/content-pipeline/types";

const CONTENT_ROOT = path.join(process.cwd(), "content");

export function listBookSlugs(): string[] {
  if (!fs.existsSync(CONTENT_ROOT)) return [];
  return fs.readdirSync(CONTENT_ROOT).filter((slug) => {
    return fs.existsSync(path.join(CONTENT_ROOT, slug, "manifest.json"));
  });
}

export function getBookManifest(slug: string): BookManifest | null {
  const manifestPath = path.join(CONTENT_ROOT, slug, "manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
}

export function listBookManifests(): BookManifest[] {
  return listBookSlugs()
    .map((slug) => getBookManifest(slug))
    .filter((m): m is BookManifest => m !== null);
}

export function getLesson(slug: string, partIndex: number, sectionIndex: number): Lesson | null {
  const lessonPath = path.join(
    CONTENT_ROOT,
    slug,
    "lessons",
    `part-${partIndex}`,
    `section-${sectionIndex}.json`
  );
  if (!fs.existsSync(lessonPath)) return null;
  return JSON.parse(fs.readFileSync(lessonPath, "utf-8"));
}
