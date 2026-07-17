import TopStatusBar from "@/components/TopStatusBar";
import BookOverview from "@/components/BookOverview";
import PartOverview from "@/components/PartOverview";
import LessonPlayer from "@/components/LessonPlayer";
import Link from "next/link";
import { useCurrentPath } from "./nav";
import { getBookManifest, getLesson, listBookManifests } from "./content-client";

function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-6 text-center">
      <p className="text-4xl">🤔</p>
      <h1 className="text-xl font-extrabold">找不到這個頁面</h1>
      <Link
        href="/"
        className="rounded-2xl border-b-4 border-duo-green-dark bg-duo-green px-6 py-3 font-extrabold text-white active:translate-y-1 active:border-b-0"
      >
        回到書櫃
      </Link>
    </main>
  );
}

function HomePage() {
  const books = listBookManifests();

  return (
    <>
      <TopStatusBar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-extrabold">我的書櫃</h1>
          <p className="text-sm font-semibold text-duo-gray-dark">
            從你喜歡的書裡，練習超過 B1 等級的英文單字。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {books.map((book) => {
            const totalSections = book.parts.reduce((sum, p) => sum + p.sectionCount, 0);
            const totalWords = book.parts.reduce((sum, p) => sum + p.wordCount, 0);
            return (
              <Link
                key={book.slug}
                href={`/book/${book.slug}`}
                className="flex flex-col gap-2 rounded-3xl border-2 border-b-4 border-duo-gray bg-white p-5 transition active:translate-y-1 active:border-b-2"
              >
                <h2 className="text-xl font-extrabold">{book.title}</h2>
                <p className="text-sm font-semibold text-duo-gray-dark">{book.author}</p>
                <p className="mt-2 text-sm font-bold text-duo-blue-dark">
                  {book.parts.length} 大題・{totalSections} 課・{totalWords} 個生字
                </p>
              </Link>
            );
          })}

          <div className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-duo-gray-dark bg-white/60 p-5 text-center text-duo-gray-dark">
            <span className="text-3xl font-extrabold">＋</span>
            <span className="text-sm font-extrabold">新增書籍</span>
            <span className="text-xs font-semibold">
              這是離線單檔版，新增書籍需要用完整開發環境跑內容處理流程
            </span>
          </div>
        </div>
      </main>
    </>
  );
}

function BookPage({ bookSlug }: { bookSlug: string }) {
  const manifest = getBookManifest(bookSlug);
  if (!manifest) return <NotFound />;

  return (
    <>
      <TopStatusBar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-extrabold">{manifest.title}</h1>
          <p className="text-sm font-semibold text-duo-gray-dark">{manifest.author}</p>
        </div>
        <BookOverview manifest={manifest} />
      </main>
    </>
  );
}

function PartPage({ bookSlug, partIndex }: { bookSlug: string; partIndex: number }) {
  const manifest = getBookManifest(bookSlug);
  const part = manifest?.parts.find((p) => p.index === partIndex);
  if (!manifest || !part) return <NotFound />;

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

function SectionPage({
  bookSlug,
  partIndex,
  sectionIndex,
}: {
  bookSlug: string;
  partIndex: number;
  sectionIndex: number;
}) {
  const manifest = getBookManifest(bookSlug);
  const part = manifest?.parts.find((p) => p.index === partIndex);
  if (!manifest || !part) return <NotFound />;

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

const BOOK_RE = /^\/book\/([^/]+)$/;
const PART_RE = /^\/book\/([^/]+)\/part\/(\d+)$/;
const SECTION_RE = /^\/book\/([^/]+)\/part\/(\d+)\/section\/(\d+)$/;

export default function App() {
  const path = useCurrentPath();

  if (path === "/" || path === "") return <HomePage />;

  const sectionMatch = path.match(SECTION_RE);
  if (sectionMatch) {
    return (
      <SectionPage
        bookSlug={sectionMatch[1]}
        partIndex={Number.parseInt(sectionMatch[2], 10)}
        sectionIndex={Number.parseInt(sectionMatch[3], 10)}
      />
    );
  }

  const partMatch = path.match(PART_RE);
  if (partMatch) {
    return <PartPage bookSlug={partMatch[1]} partIndex={Number.parseInt(partMatch[2], 10)} />;
  }

  const bookMatch = path.match(BOOK_RE);
  if (bookMatch) {
    return <BookPage bookSlug={bookMatch[1]} />;
  }

  return <NotFound />;
}
