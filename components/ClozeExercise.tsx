"use client";

import { useState } from "react";
import OptionButton from "./OptionButton";
import type { LessonExercise } from "@/scripts/content-pipeline/types";

export default function ClozeExercise({
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
      <p className="text-sm font-bold text-duo-gray-dark">選出正確的單字，完成句子</p>
      <p className="text-xl font-bold leading-relaxed">
        {exercise.prompt.split("_____").map((chunk, i, arr) => (
          <span key={i}>
            {chunk}
            {i < arr.length - 1 && (
              <span className="inline-block min-w-16 border-b-4 border-duo-blue align-bottom" />
            )}
          </span>
        ))}
      </p>
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
