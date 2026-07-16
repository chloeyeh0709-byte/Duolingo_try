"use client";

import { useState } from "react";
import OptionButton from "./OptionButton";
import type { LessonExercise } from "@/scripts/content-pipeline/types";

export default function TranslationExercise({
  exercise,
  onComplete,
}: {
  exercise: LessonExercise;
  onComplete: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const handlePick = (option: string) => {
    if (selected) return;
    setSelected(option);
    onComplete(option === exercise.answer);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-bold text-duo-gray-dark">哪一個英文單字是這個意思？</p>
      <p className="text-3xl font-extrabold">{exercise.prompt}</p>
      <div className="flex flex-col gap-3">
        {(exercise.options ?? []).map((option) => {
          const state = !selected
            ? "idle"
            : option === exercise.answer
              ? "correct"
              : option === selected
                ? "incorrect"
                : "disabled";
          return (
            <OptionButton
              key={option}
              label={option}
              state={state}
              onClick={() => handlePick(option)}
            />
          );
        })}
      </div>
    </div>
  );
}
