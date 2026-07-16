const BAR_DELAYS = [0, 0.15, 0.3, 0.45, 0.6];

export function ProcessingIndicator() {
  return (
    <div className="flex h-5 items-end gap-0.5" aria-hidden="true">
      {BAR_DELAYS.map((delay, i) => (
        <span
          key={i}
          className="w-1 origin-bottom animate-eq rounded-full bg-violet-500 dark:bg-violet-400"
          style={{ height: "100%", animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
}
