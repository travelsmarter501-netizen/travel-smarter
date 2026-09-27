"use client";

import { useState, type MouseEvent } from "react";
import { IconCheck, IconCopy } from "../icons";

/**
 * Copies text using the modern Clipboard API when available (HTTPS or localhost),
 * falling back to a hidden-textarea + execCommand("copy") for insecure contexts
 * (e.g. testing over a local-network IP like http://192.168.x.x:3000, where
 * navigator.clipboard is undefined by spec). Returns whether the copy succeeded.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy fallback below
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    // Keep it out of view and unable to affect layout or scroll position.
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.width = "1px";
    textarea.style.height = "1px";
    textarea.style.padding = "0";
    textarea.style.border = "none";
    textarea.style.outline = "none";
    textarea.style.boxShadow = "none";
    textarea.style.background = "transparent";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const succeeded = document.execCommand("copy");
    document.body.removeChild(textarea);
    return succeeded;
  } catch {
    return false;
  }
}

/**
 * Reusable copy-to-clipboard button. Used by LocationInfo, and safe to reuse anywhere
 * else a piece of text (address, phone number, etc.) should be copyable.
 */
export default function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const succeeded = await copyToClipboard(text);
    if (succeeded) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="نسخ الموقع"
      className={`relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-teal-300 hover:text-teal-700 ${className ?? ""}`}
    >
      {copied ? <IconCheck className="h-3.5 w-3.5 text-teal-600" /> : <IconCopy className="h-3.5 w-3.5" />}
      {copied && (
        <span className="pointer-events-none absolute -top-8 right-1/2 z-10 translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-sm">
          تم نسخ العنوان ✓
        </span>
      )}
    </button>
  );
}
