"use client";

import { useMemo, useState } from "react";
import type { Lesson } from "@/scripts/content-pipeline/types";
import { HEARTS, completeSection, recordAnswer } from "@/lib/progress";
import { useProgress } from "@/lib/useProgress";
import ReadingMode from "./ReadingMode";
import WordFlashcard from "./WordFlashcard";
import MultipleChoiceExercise from "./MultipleChoiceExercise";
import ClozeExercise from "./ClozeExercise";
import TranslationExercise from "./TranslationExercise";
import ResultsSummary from "./ResultsSummary";

type Step = "reading" | "flashcards" | "exercises" | "results";

export default function LessonPlayer({
  lesson,
  bookHref,
  nextHref,
}: {
  lesson: Lesson;
  bookHref: string;
  nextHref: string | null;
}) {
  const [step, setStep] = useState<Step>("reading");
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [hearts, setHearts] = useState(HEARTS.starting);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [missedLemmas, setMissedLemmas] = useState<Set<string>>(new Set());
  const [restartFlash, setRestartFlash] = useState(false);
  const progress = useProgress();

  const exercises = lesson.exercises;
  const currentExercise = exercises[exerciseIndex];

  const xpEarned = useMemo(() => correctCount * 10 + (step === "results" ? 20 : 0), [
    correctCount,
    step,
  ]);

  const handleExerciseComplete = (correct: boolean) => {
    const next = recordAnswer(progress, lesson.bookSlug, currentExercise.wordLemma, correct);
    setAnsweredCount((c) => c + 1);

    if (correct) {
      setCorrectCount((c) => c + 1);
    } else {
      setMissedLemmas((prev) => new Set(prev).add(currentExercise.wordLemma));
    }

    window.setTimeout(() => {
      if (!correct) {
        const heartsLeft = hearts - 1;
        setHearts(heartsLeft);
        if (heartsLeft <= 0) {
          setHearts(HEARTS.starting);
          setExerciseIndex(0);
          setRestartFlash(true);
          window.setTimeout(() => setRestartFlash(false), 2000);
          return;
        }
      }
      if (exerciseIndex + 1 >= exercises.length) {
        completeSection(
          next,
          lesson.bookSlug,
          lesson.partIndex,
          lesson.sectionIndex,
          Math.round(((correctCount + (correct ? 1 : 0)) / exercises.length) * 100)
        );
        setStep("results");
      } else {
        setExerciseIndex((i) => i + 1);
      }
    }, 900);
  };

  if (step === "reading") {
    return (
      <ReadingMode
        paragraphs={lesson.paragraphs}
        words={lesson.words}
        onDone={() => setStep("flashcards")}
      />
    );
  }

  if (step === "flashcards") {
    const word = lesson.words[flashcardIndex];
    return (
      <div className="flex flex-col gap-6">
        <p className="text-center text-sm font-bold text-duo-gray-dark">
          新單字 {flashcardIndex + 1} / {lesson.words.length}
        </p>
        <WordFlashcard word={word} />
        <button
          type="button"
          onClick={() => {
            if (flashcardIndex + 1 >= lesson.words.length) {
              setStep("exercises");
            } else {
              setFlashcardIndex((i) => i + 1);
            }
          }}
          className="rounded-2xl border-b-4 border-duo-blue-dark bg-duo-blue py-3 text-center font-extrabold text-white active:translate-y-1 active:border-b-0"
        >
          {flashcardIndex + 1 >= lesson.words.length ? "開始練習題 →" : "下一個單字"}
        </button>
      </div>
    );
  }

  if (step === "exercises") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-duo-gray-dark">
            練習 {exerciseIndex + 1} / {exercises.length}
          </p>
          <p className="text-lg font-extrabold text-duo-red-dark">
            {"❤️".repeat(hearts)}
            {"🖤".repeat(HEARTS.starting - hearts)}
          </p>
        </div>

        {restartFlash && (
          <p className="rounded-xl bg-duo-red/10 p-3 text-center font-bold text-duo-red-dark">
            生命值用完了，重新開始這課的練習！
          </p>
        )}

        {currentExercise.type === "multiple-choice" && (
          <MultipleChoiceExercise
            key={exerciseIndex}
            exercise={currentExercise}
            onComplete={handleExerciseComplete}
          />
        )}
        {currentExercise.type === "cloze" && (
          <ClozeExercise
            key={exerciseIndex}
            exercise={currentExercise}
            onComplete={handleExerciseComplete}
          />
        )}
        {currentExercise.type === "translation" && (
          <TranslationExercise
            key={exerciseIndex}
            exercise={currentExercise}
            onComplete={handleExerciseComplete}
          />
        )}
      </div>
    );
  }

  return (
    <ResultsSummary
      correctCount={correctCount}
      totalCount={answeredCount}
      xpEarned={xpEarned}
      missedWords={Array.from(missedLemmas)}
      nextHref={nextHref}
      bookHref={bookHref}
    />
  );
}
