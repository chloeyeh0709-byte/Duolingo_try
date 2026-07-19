"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Lesson, LessonExercise, WordEntry } from "@/scripts/content-pipeline/types";
import {
  HEARTS,
  completePracticeGroup,
  completeSection,
  isPracticeGroupCompleted,
  recordAnswer,
} from "@/lib/progress";
import { useProgress } from "@/lib/useProgress";
import ReadingMode from "./ReadingMode";
import WordFlashcard from "./WordFlashcard";
import MultipleChoiceExercise from "./MultipleChoiceExercise";
import ClozeExercise from "./ClozeExercise";
import TranslationExercise from "./TranslationExercise";
import ResultsSummary from "./ResultsSummary";

type Step = "reading" | "flashcards" | "exercises" | "results";

const PRACTICE_GROUP_SIZE = 20;

function splitIntoPracticeGroups(words: WordEntry[]): WordEntry[][] {
  const groups: WordEntry[][] = [];
  for (let i = 0; i < words.length; i += PRACTICE_GROUP_SIZE) {
    groups.push(words.slice(i, i + PRACTICE_GROUP_SIZE));
  }
  return groups;
}

/** Creates a fixed exercise set for a fixed word group; no random selection or shuffling. */
function buildGroupExercises(words: WordEntry[]): LessonExercise[] {
  return words.map((word, index) => {
    const alternatives = words.filter((candidate) => candidate.lemma !== word.lemma).slice(0, 3);

    if (index % 3 === 0) {
      return {
        type: "multiple-choice",
        wordLemma: word.lemma,
        prompt: word.lemma,
        options: [word.definitionEn, ...word.distractors],
        answer: word.definitionEn,
      };
    }

    if (index % 3 === 1) {
      return {
        type: "cloze",
        wordLemma: word.lemma,
        prompt: word.clozeSentence,
        options: [word.clozeAnswerSurfaceForm, ...alternatives.map((candidate) => candidate.clozeAnswerSurfaceForm)],
        answer: word.clozeAnswerSurfaceForm,
      };
    }

    return {
      type: "translation",
      wordLemma: word.lemma,
      prompt: word.translationZh,
      options: [word.lemma, ...alternatives.map((candidate) => candidate.lemma)],
      answer: word.lemma,
    };
  });
}

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
  const [groupIndex, setGroupIndex] = useState(0);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [hearts, setHearts] = useState(HEARTS.starting);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [missedLemmas, setMissedLemmas] = useState<Set<string>>(new Set());
  const [restartFlash, setRestartFlash] = useState(false);
  const progress = useProgress();
  const initializedLessonKey = useRef<string | null>(null);
  const lessonKey = `${lesson.bookSlug}:${lesson.partIndex}:${lesson.sectionIndex}`;
  const practiceGroups = useMemo(() => splitIntoPracticeGroups(lesson.words), [lesson.words]);

  useEffect(() => {
    if (initializedLessonKey.current === lessonKey) return;
    const firstIncompleteGroup = practiceGroups.findIndex(
      (_, index) =>
        !isPracticeGroupCompleted(
          progress,
          lesson.bookSlug,
          lesson.partIndex,
          lesson.sectionIndex,
          index
        )
    );
    setGroupIndex(firstIncompleteGroup === -1 ? 0 : firstIncompleteGroup);
    initializedLessonKey.current = lessonKey;
  }, [lessonKey, lesson.bookSlug, lesson.partIndex, lesson.sectionIndex, practiceGroups, progress]);

  const practiceWords = practiceGroups[groupIndex] ?? [];
  const exercises = useMemo(() => buildGroupExercises(practiceWords), [practiceWords]);
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
        const accuracy = Math.round(
          ((correctCount + (correct ? 1 : 0)) / exercises.length) * 100
        );
        const afterGroup = completePracticeGroup(
          next,
          lesson.bookSlug,
          lesson.partIndex,
          lesson.sectionIndex,
          groupIndex,
          accuracy
        );
        if (groupIndex + 1 >= practiceGroups.length) {
          completeSection(
            afterGroup,
            lesson.bookSlug,
            lesson.partIndex,
            lesson.sectionIndex,
            accuracy
          );
        }
        setStep("results");
      } else {
        setExerciseIndex((i) => i + 1);
      }
    }, 900);
  };

  if (step === "reading") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-center text-sm font-bold text-duo-gray-dark">
          這一課共有 {lesson.words.length} 個超過 B1 的單字；第 {groupIndex + 1} 組 / 共 {practiceGroups.length} 組，這組練習 {practiceWords.length} 個
        </p>
        <ReadingMode
          paragraphs={lesson.paragraphs}
          words={lesson.words}
          onDone={() => setStep("flashcards")}
        />
      </div>
    );
  }

  if (step === "flashcards") {
    const word = practiceWords[flashcardIndex];
    return (
      <div className="flex flex-col gap-6">
        <p className="text-center text-sm font-bold text-duo-gray-dark">
          新單字 {flashcardIndex + 1} / {practiceWords.length}
        </p>
        <WordFlashcard word={word} />
        <button
          type="button"
          onClick={() => {
            if (flashcardIndex + 1 >= practiceWords.length) {
              setStep("exercises");
            } else {
              setFlashcardIndex((i) => i + 1);
            }
          }}
          className="rounded-2xl border-b-4 border-duo-blue-dark bg-duo-blue py-3 text-center font-extrabold text-white active:translate-y-1 active:border-b-0"
        >
          {flashcardIndex + 1 >= practiceWords.length ? "開始練習題 →" : "下一個單字"}
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
      nextGroupLabel={
        groupIndex + 1 < practiceGroups.length
          ? `練習第 ${groupIndex + 2} 組 / 共 ${practiceGroups.length} 組`
          : undefined
      }
      onNextGroup={
        groupIndex + 1 < practiceGroups.length
          ? () => {
              setGroupIndex((index) => index + 1);
              setFlashcardIndex(0);
              setExerciseIndex(0);
              setAnsweredCount(0);
              setCorrectCount(0);
              setMissedLemmas(new Set());
              setHearts(HEARTS.starting);
              setStep("reading");
            }
          : undefined
      }
    />
  );
}
