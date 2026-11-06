"use client";

import { Fragment } from "react";
import Price from "../Price";

/**
 * Renders copy that contains the "{price}" placeholder, putting the price (in the visitor's selected currency, via the shared Price
 * component) where the placeholder is. The price is never struck through here.
 */
export default function TextWithPrice({ text, ils, priceClassName = "font-bold text-slate-900" }: { text: string; ils: number; priceClassName?: string }) {
  const parts = text.split("{price}");
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 && <Price ils={ils} className={priceClassName} />}
          {part}
        </Fragment>
      ))}
    </>
  );
}
