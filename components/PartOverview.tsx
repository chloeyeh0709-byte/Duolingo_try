"use client";

import type { BookManifest } from "@/scripts/content-pipeline/types";
import { isSectionCompleted, isSectionUnlocked } from "@/lib/progress";
import { useProgress } from "@/lib/useProgress";
import PathMap, { type PathNode } from "./PathMap";

export default function PartOverview({
  manifest,
  partIndex,
  partTitle,
  sectionCount,
}: {
  manifest: BookManifest;
  partIndex: number;
  partTitle: string;
  sectionCount: number;
}) {
  const progress = useProgress();

  const nodes: PathNode[] = Array.from({ length: sectionCount }, (_, i) => i + 1).map(
    (sectionIndex) => {
      const unlocked = isSectionUnlocked(manifest, progress, partIndex, sectionIndex);
      const completed = isSectionCompleted(progress, manifest.slug, partIndex, sectionIndex);
      return {
        id: `section-${sectionIndex}`,
        title: `${partTitle} · 第 ${sectionIndex} 課`,
        href: `/book/${manifest.slug}/part/${partIndex}/section/${sectionIndex}`,
        status: completed ? "completed" : unlocked ? "available" : "locked",
      };
    }
  );

  return <PathMap nodes={nodes} />;
}
