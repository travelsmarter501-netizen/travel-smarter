"use client";

import { IconStar } from "../icons";
import ExternalLink from "./ExternalLink";

/** "1240" → "1.2K", "12400" → "12.4K", "307491" → "307K". Raw number is always kept in data — this is display-only. */
export function formatReviewCount(n: number): string {
  if (n < 1000) return n.toLocaleString("en-US");
  if (n < 100_000) {
    const k = Math.round((n / 1000) * 10) / 10;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `${Math.round(n / 1000)}K`;
}

/**
 * Reusable compact rating display for any real physical place, in any destination guide:
 * "⭐ 4.8 (307K) · Google". Never invented — renders nothing when no verified rating exists.
 * Clickable through to the real listing when a ratingUrl is available.
 */
export default function RatingBadge({
  rating,
  reviewCount,
  ratingSource,
  ratingUrl,
  className,
}: {
  rating?: number;
  reviewCount?: number;
  ratingSource?: string;
  ratingUrl?: string;
  className?: string;
}) {
  if (!rating) return null;

  const content = (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold text-amber-600 ${className ?? ""}`}>
      <IconStar filled className="h-3 w-3 shrink-0" />
      <span>{rating}</span>
      {reviewCount != null && <span className="font-normal text-slate-400">({formatReviewCount(reviewCount)})</span>}
      {ratingSource && <span className="font-normal text-slate-400">· {ratingSource}</span>}
    </span>
  );

  if (!ratingUrl) return content;

  return (
    <ExternalLink
      href={ratingUrl}
      onClick={(event) => event.stopPropagation()}
      aria-label={`قراءة المراجعات على ${ratingSource ?? "الخريطة"}`}
      className="w-fit hover:underline"
    >
      {content}
    </ExternalLink>
  );
}
