import { notFound } from "next/navigation";
import Link from "next/link";
import TopStatusBar from "@/components/TopStatusBar";
import PartOverview from "@/components/PartOverview";
import { getBookManifest } from "@/lib/content";

export default async function PartPage({
  params,
}: {
  params: Promise<{ bookSlug: string; partId: string }>;
}) {
  const { bookSlug, partId } = await params;
  const partIndex = Number.parseInt(partId, 10);
  const manifest = getBookManifest(bookSlug);
  const part = manifest?.parts.find((p) => p.index === partIndex);
  if (!manifest || !part) notFound();

  return (
    <>
      <TopStatusBar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <div className="mb-4 text-center">
          <Link href={`/book/${bookSlug}`} className="text-sm font-bold text-duo-blue-dark">
            ← {manifest.title}
          </Link>
          <h1 className="text-2xl font-extrabold">{part.title}</h1>
        </div>
        <PartOverview
          manifest={manifest}
          partIndex={partIndex}
          partTitle={part.title}
          sectionCount={part.sectionCount}
        />
      </main>
    </>
  );
}
