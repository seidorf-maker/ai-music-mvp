"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const OPTIONS = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "system", label: "System", icon: SystemIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid rendering theme-dependent state until after hydration, since the
  // server has no way to know the client's stored preference.
  useEffect(() => setMounted(true), []);

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className="inline-flex items-center gap-0.5 rounded-full border border-neutral-200 bg-white/80 p-0.5 shadow-sm backdrop-blur transition-colors dark:border-neutral-800 dark:bg-neutral-900/80"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 ${
              active
                ? "bg-neutral-900 text-white shadow dark:bg-white dark:text-neutral-900"
                : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path
        strokeLinecap="round"
        d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function SystemIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path strokeLinecap="round" d="M8 20h8M12 16v4" />
    </svg>
  );
}
