import { notFound } from "next/navigation";
import TopStatusBar from "@/components/TopStatusBar";
import BookOverview from "@/components/BookOverview";
import { getBookManifest } from "@/lib/content";

export default async function BookPage({
  params,
}: {
  params: Promise<{ bookSlug: string }>;
}) {
  const { bookSlug } = await params;
  const manifest = getBookManifest(bookSlug);
  if (!manifest) notFound();

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
