"use client";

import { useEffect } from "react";
import { captureAttribution } from "../lib/attribution";

/** Renders nothing. On first load it remembers the campaign tag from the landing URL for this tab (see lib/attribution.ts). */
export default function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
