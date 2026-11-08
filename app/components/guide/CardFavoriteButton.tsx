"use client";

import { IconHeart } from "../icons";

/**
 * The favourite button of a place card that has NO photo: the card then has no image area at all (no empty grey box), so the
 * button sits in the card's own corner and the text area keeps room for it (`pl-14` on the content).
 */
export default function CardFavoriteButton({ isFavorite, onToggle, addLabel, removeLabel }: { isFavorite: boolean; onToggle: () => void; addLabel: string; removeLabel: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? removeLabel : addLabel}
      className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-rose-600 shadow-sm"
    >
      <IconHeart filled={isFavorite} className="h-4 w-4" />
    </button>
  );
}
