import { notFound } from "next/navigation";
import Link from "next/link";
import LessonPlayer from "@/components/LessonPlayer";
import { getBookManifest, getLesson } from "@/lib/content";

export default async function SectionPage({
  params,
}: {
  params: Promise<{ bookSlug: string; partId: string; sectionId: string }>;
}) {
  const { bookSlug, partId, sectionId } = await params;
  const partIndex = Number.parseInt(partId, 10);
  const sectionIndex = Number.parseInt(sectionId, 10);

  const manifest = getBookManifest(bookSlug);
  const part = manifest?.parts.find((p) => p.index === partIndex);
  if (!manifest || !part) notFound();

  const bookHref = `/book/${bookSlug}/part/${partIndex}`;
  const lesson = getLesson(bookSlug, partIndex, sectionIndex);
  if (!lesson) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-6 text-center">
        <p className="text-4xl">🚧</p>
        <h1 className="text-xl font-extrabold">這一課的內容還沒產生</h1>
        <p className="text-sm font-semibold text-duo-gray-dark">
          內容處理流程尚未針對這個小節產生生字與練習題。
        </p>
        <Link
          href={bookHref}
          className="rounded-2xl border-b-4 border-duo-green-dark bg-duo-green px-6 py-3 font-extrabold text-white active:translate-y-1 active:border-b-0"
        >
          回到課程地圖
        </Link>
      </main>
    );
  }

  let nextHref: string | null = null;
  if (sectionIndex < part.sectionCount) {
    nextHref = `/book/${bookSlug}/part/${partIndex}/section/${sectionIndex + 1}`;
  } else {
    const nextPart = manifest.parts.find((p) => p.index === partIndex + 1);
    if (nextPart) {
      nextHref = `/book/${bookSlug}/part/${nextPart.index}/section/1`;
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <Link href={bookHref} className="text-sm font-bold text-duo-blue-dark">
        ✕ 離開課程
      </Link>
      <LessonPlayer lesson={lesson} bookHref={bookHref} nextHref={nextHref} />
    </main>
  );
}
