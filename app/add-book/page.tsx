import Link from "next/link";
import TopStatusBar from "@/components/TopStatusBar";

const steps = [
  {
    title: "1. 準備 epub 檔",
    body: "把想學的書的 epub 檔放到本機（不要放進 git repo），並在 scripts/content-pipeline/sources.ts 新增一筆 BookSource 設定（書名、章節檔案的比對規則、分節分隔線的 CSS class）。",
  },
  {
    title: "2. 跑內容處理流程",
    body: "依序執行 extract-epub.ts → tokenize.ts → cefr-lookup.ts，會產生每個小節的生字候選清單（哪些字超過 B1、哪些字詞表查不到）。",
  },
  {
    title: "3. 產生生字內容",
    body: "把詞表查不到的字交給 AI 判斷等級，並幫每個超過 B1 的字產生定義、翻譯、例句、克漏字與練習題選項。",
  },
  {
    title: "4. 建立課程",
    body: "執行 build-lessons.ts，整合成最終的課程 JSON 與 manifest.json，這本書就會出現在書櫃上了。",
  },
];

export default function AddBookPage() {
  return (
    <>
      <TopStatusBar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-extrabold">新增書籍</h1>
          <p className="text-sm font-semibold text-duo-gray-dark">
            這套系統可以用任何一本你有興趣的書建立課程，目前用 epub 搭配一套內容處理流程來產生生字關卡。
          </p>
        </div>

        <ol className="flex flex-col gap-4">
          {steps.map((step) => (
            <li key={step.title} className="rounded-2xl border-2 border-duo-gray bg-white p-4">
              <p className="font-extrabold text-duo-blue-dark">{step.title}</p>
              <p className="mt-1 text-sm font-semibold leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>

        <Link
          href="/"
          className="rounded-2xl border-b-4 border-duo-green-dark bg-duo-green py-3 text-center font-extrabold text-white active:translate-y-1 active:border-b-0"
        >
          回到書櫃
        </Link>
      </main>
    </>
  );
}
