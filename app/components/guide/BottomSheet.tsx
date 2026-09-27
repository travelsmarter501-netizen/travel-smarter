"use client";

import { useEffect, type ReactNode } from "react";
import { IconClose } from "../icons";

/**
 * Shared bottom-sheet primitive: backdrop + slide-up panel, Escape-to-close,
 * click-outside-to-close, body-scroll lock while open. Reused by the place-details
 * sheet and the transport-options sheet so the interaction pattern stays identical.
 */
export default function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[85vh] sm:max-w-lg sm:rounded-3xl"
      >
        <div className="flex flex-shrink-0 flex-col gap-2 border-b border-slate-100 px-4 pb-3 pt-2.5 sm:px-5 sm:pb-3.5 sm:pt-3.5">
          <span className="mx-auto h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-slate-900">{title}</p>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <IconClose className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
