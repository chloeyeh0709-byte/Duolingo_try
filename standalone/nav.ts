import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
let currentPath = normalizePath(window.location.hash.slice(1) || "/");

function normalizePath(path: string): string {
  if (!path.startsWith("/")) path = "/" + path;
  return path;
}

function notify() {
  for (const l of listeners) l();
}

export function navigate(path: string): void {
  currentPath = normalizePath(path);
  window.location.hash = currentPath;
  notify();
}

window.addEventListener("hashchange", () => {
  currentPath = normalizePath(window.location.hash.slice(1) || "/");
  notify();
});

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): string {
  return currentPath;
}

export function useCurrentPath(): string {
  return useSyncExternalStore(subscribe, getSnapshot);
}
