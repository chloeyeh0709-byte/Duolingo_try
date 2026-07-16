"use client";

import type { BookManifest } from "@/scripts/content-pipeline/types";
import { isPartCompleted, isPartUnlocked } from "@/lib/progress";
import { useProgress } from "@/lib/useProgress";
import PathMap, { type PathNode } from "./PathMap";

export default function BookOverview({ manifest }: { manifest: BookManifest }) {
  const progress = useProgress();

  const nodes: PathNode[] = manifest.parts.map((part) => {
    const unlocked = isPartUnlocked(manifest, progress, part.index);
    const completed = isPartCompleted(manifest, progress, part.index);
    return {
      id: `part-${part.index}`,
      title: part.title,
      subtitle: `${part.sectionCount} 課・${part.wordCount} 個生字`,
      href: `/book/${manifest.slug}/part/${part.index}`,
      status: completed ? "completed" : unlocked ? "available" : "locked",
    };
  });

  return <PathMap nodes={nodes} />;
}
