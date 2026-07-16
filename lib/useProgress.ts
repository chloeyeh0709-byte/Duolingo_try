"use client";

import { useSyncExternalStore } from "react";
import {
  getProgressSnapshot,
  getServerProgressSnapshot,
  subscribeProgress,
  type AppProgress,
} from "./progress";

export function useProgress(): AppProgress {
  return useSyncExternalStore(subscribeProgress, getProgressSnapshot, getServerProgressSnapshot);
}
