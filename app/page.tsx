import Link from "next/link";
import TopStatusBar from "@/components/TopStatusBar";
import { listBookManifests } from "@/lib/content";

export default function HomePage() {
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

          <Link
            href="/add-book"
            className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-duo-gray-dark bg-white/60 p-5 text-duo-gray-dark transition hover:border-duo-blue hover:text-duo-blue-dark"
          >
            <span className="text-3xl font-extrabold">＋</span>
            <span className="text-sm font-extrabold">新增書籍</span>
          </Link>
        </div>

        {books.length === 0 && (
          <p className="rounded-2xl bg-duo-gray/30 p-4 text-sm font-semibold">
            還沒有任何課程內容，先執行內容處理流程（scripts/content-pipeline）產生一本書的課程吧。
          </p>
        )}
      </main>
    </>
  );
}
