"use client";

/**
 * Shared pill-button option group for the Custom Plan request form -- one component for both
 * single-select (radio-like) and multi-select (checkbox-like) fields, since every option list
 * in this form (interests, accommodation status) uses the exact same visual pattern. Mirrors
 * the button-pill style already established by InterestSelector elsewhere in this project.
 */
export default function PillSelect<T extends string | boolean>({
  options,
  value,
  onChange,
  multiple = false,
  columns = 2,
}: {
  options: { value: T; label: string }[];
  value: T[];
  onChange: (next: T[]) => void;
  multiple?: boolean;
  columns?: 2 | 3;
}) {
  function toggle(option: T) {
    if (multiple) {
      onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
    } else {
      onChange(value.includes(option) ? [] : [option]);
    }
  }

  return (
    <div className={`grid gap-2 ${columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
      {options.map((option) => {
        const active = value.includes(option.value);
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(option.value)}
            className={`rounded-xl border px-3 py-2.5 text-center text-sm font-semibold transition-colors ${
              active ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
