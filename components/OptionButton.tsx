"use client";

type OptionState = "idle" | "correct" | "incorrect" | "disabled";

export default function OptionButton({
  label,
  state,
  onClick,
}: {
  label: string;
  state: OptionState;
  onClick: () => void;
}) {
  const styles: Record<OptionState, string> = {
    idle: "border-duo-gray bg-white hover:bg-duo-gray/30 active:translate-y-0.5",
    disabled: "border-duo-gray bg-white opacity-60",
    correct: "border-duo-green-dark bg-duo-green/20 text-duo-green-dark",
    incorrect: "border-duo-red-dark bg-duo-red/10 text-duo-red-dark",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === "disabled" || state === "correct" || state === "incorrect"}
      className={`w-full rounded-2xl border-2 border-b-4 px-4 py-3 text-left text-base font-bold transition ${styles[state]}`}
    >
      {label}
    </button>
  );
}
