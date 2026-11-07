/**
 * Questionnaire feedback ("خطة مخصصة إلك" only): the selected-choice look and a light haptic pulse when a choice really changes.
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

/**
 * One short, light vibration. Callers use it only when a choice actually changes (never for Next / Back, never when re-tapping a choice
 * that changes nothing), and only from a click handler, i.e. after a real user activation.
 *
 * Uses the Vibration API: present in Android Chrome and most Android browsers / WebViews. iPhone Safari (and every iOS browser, in-app
 * browsers included) does not expose it, so there the visual press and the blue frame are the only feedback. No sound fallback. A
 * successful call does not prove the device vibrated (the OS may ignore it, e.g. in silent / battery-saver modes).
 */
export function quizHaptic(): void {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(12);
  } catch {
    // Haptics are optional feedback; never let them affect the questionnaire.
  }
}
