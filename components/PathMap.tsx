import Link from "next/link";

export interface PathNode {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  status: "locked" | "available" | "completed";
}

const STATUS_STYLES: Record<PathNode["status"], string> = {
  completed: "bg-duo-green border-duo-green-dark text-white shadow-[0_6px_0_var(--color-duo-green-dark)]",
  available:
    "bg-duo-blue border-duo-blue-dark text-white shadow-[0_6px_0_var(--color-duo-blue-dark)] animate-[bounce_2s_ease-in-out_infinite]",
  locked: "bg-duo-gray border-duo-gray-dark text-duo-gray-dark shadow-[0_6px_0_var(--color-duo-gray-dark)]",
};

function offsetForIndex(index: number): number {
  // Gentle zig-zag path, echoing Duolingo's winding skill-tree road.
  return Math.round(Math.sin(index * 0.9) * 72);
}

export default function PathMap({ nodes }: { nodes: PathNode[] }) {
  return (
    <ol className="mx-auto flex max-w-md flex-col items-center gap-10 py-10">
      {nodes.map((node, index) => {
        const offset = offsetForIndex(index);
        const isLocked = node.status === "locked";
        const icon = node.status === "completed" ? "★" : node.status === "locked" ? "🔒" : "▶";

        const content = (
          <>
            <div
              className={`flex h-20 w-20 flex-col items-center justify-center rounded-full border-b-4 text-2xl font-extrabold transition-transform active:translate-y-1 active:shadow-none ${STATUS_STYLES[node.status]}`}
            >
              {icon}
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-[color:var(--foreground)]">{node.title}</p>
              {node.subtitle && (
                <p className="text-xs font-semibold text-duo-gray-dark">{node.subtitle}</p>
              )}
            </div>
          </>
        );

        return (
          <li
            key={node.id}
            style={{ transform: `translateX(${offset}px)` }}
            className="flex flex-col items-center gap-2"
          >
            {isLocked ? (
              <div className="flex cursor-not-allowed flex-col items-center gap-2" aria-disabled>
                {content}
              </div>
            ) : (
              <Link href={node.href} className="group flex flex-col items-center gap-2">
                {content}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
