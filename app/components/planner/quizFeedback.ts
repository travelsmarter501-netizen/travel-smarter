"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Questionnaire feedback ("خطة مخصصة إلك" only): the selected-choice look and the short click sound.
 *
 * Selected choice (Rhyme-like): light background, dark text and a thin blue frame around the whole option -- never a filled blue box with
 * white text. The border is 1px in both states and the selected frame adds a 1px INSET ring, so nothing moves when the choice changes. The
 * filled blue stays reserved for the primary actions ("التالي", checkout). Keyboard focus keeps a visible outline; the selected state is
 * still exposed to screen readers through `aria-pressed` on each button.
 */
export const QUIZ_CHOICE_BASE =
  "border transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700";

export function quizChoiceClass(active: boolean): string {
  return active
    ? "border-teal-700 bg-teal-50 text-slate-900 shadow-[inset_0_0_0_1px_var(--color-teal-700)]"
    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300";
}

/** Press feedback for the questionnaire's navigation buttons (same scale as the choices; off with reduced motion). */
export const QUIZ_PRESS = "transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100";

// ── Click sound ─────────────────────────────────────────────────────────────────────────────────────
const MUTE_KEY = "ts-quiz-clicks-muted";
const MUTE_EVENT = "ts-quiz-clicks-muted-change";

/** In-memory copy, so muting still works for this page when storage is blocked (private mode, blocked site data). */
let memoryMuted = false;

function readMuted(): boolean {
  try {
    const stored = window.localStorage.getItem(MUTE_KEY);
    return stored === null ? memoryMuted : stored === "1";
  } catch {
    return memoryMuted;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(MUTE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(MUTE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

let audioContext: AudioContext | null = null;

/**
 * One short, quiet "tick" (~50 ms, synthesized, no audio file). Only ever called from a click handler, i.e. after a real user activation
 * (mouse, touch, or Enter / Space on a focused button); disabled buttons fire no click, so they stay silent. If the browser blocks audio,
 * nothing happens and the questionnaire works as usual.
 */
function playTick(): void {
  try {
    const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    audioContext ??= new AudioCtor();
    const ctx = audioContext;
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1500, t);
    osc.frequency.exponentialRampToValueAtTime(850, t + 0.035);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.045, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  } catch {
    // Audio is optional feedback; never let it affect the questionnaire.
  }
}

/** `click()` plays one tick unless the visitor muted clicks; `muted` / `toggleMuted` drive the small mute control (saved per browser). */
export function useQuizClick() {
  const muted = useSyncExternalStore(subscribe, readMuted, () => false);

  const click = useCallback(() => {
    if (!readMuted()) playTick();
  }, []);

  const toggleMuted = useCallback(() => {
    const next = !readMuted();
    memoryMuted = next;
    try {
      window.localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {
      // storage blocked: the setting lasts for this page only
    }
    window.dispatchEvent(new Event(MUTE_EVENT));
  }, []);

  return { click, muted, toggleMuted };
}
