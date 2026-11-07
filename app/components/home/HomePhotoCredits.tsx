"use client";

import { useLanguage } from "../../lib/language";

/**
 * Visible credits for the Wikimedia Commons photos shown in the homepage example and product gallery. Both files are CC BY-SA 4.0, which
 * requires the author, a link to the work and a link to the license next to the use (checked on Commons 2026-11-07). The photos are shown
 * unchanged (Commons' own 1280px thumbnails, cropped only by the card frame).
 */
const CREDITS = [
  {
    title: "Mercat de la Sagrada Família",
    author: "Enric",
    fileUrl: "https://commons.wikimedia.org/wiki/File:035_Mercat_de_la_Sagrada_Fam%C3%ADlia,_c._Padilla_255_(Barcelona).jpg",
  },
  {
    title: "Hospital de Sant Pau",
    author: "Thomas Ledl",
    fileUrl: "https://commons.wikimedia.org/wiki/File:Hospital_Sant_Pau,_main_facade.jpg",
  },
];
const LICENSE = { name: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/" };

export default function HomePhotoCredits({ className = "" }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <p dir="ltr" className={`text-center text-[11px] leading-5 text-muted ${className}`}>
      <span dir="auto">{t.home.example.photoCredits}</span>{" "}
      {CREDITS.map((credit, index) => (
        <span key={credit.fileUrl}>
          {index > 0 && " · "}
          <a href={credit.fileUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2 hover:text-ink">
            {credit.title}
          </a>{" "}
          — {credit.author},{" "}
          <a href={LICENSE.url} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2 hover:text-ink">
            {LICENSE.name}
          </a>
        </span>
      ))}
    </p>
  );
}
