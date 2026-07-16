"use client";

import { useState } from "react";

export type Track = {
  id: string;
  audioUrl: string;
  title: string;
  duration: number;
  tags?: string;
};

type LyricsState = "idle" | "loading" | "loaded" | "empty" | "error";

export function TrackCard({
  track,
  taskId,
  instrumental,
  index,
}: {
  track: Track;
  taskId: string;
  instrumental: boolean;
  index: number;
}) {
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsState, setLyricsState] = useState<LyricsState>("idle");
  const [lyricsText, setLyricsText] = useState("");
  const [lyricsError, setLyricsError] = useState("");

  async function fetchLyrics() {
    setLyricsState("loading");
    try {
      const res = await fetch("/api/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, audioId: track.id }),
      });
      const body = await res.json();

      if (!res.ok) {
        setLyricsState("error");
        setLyricsError(body.error || "Could not load lyrics.");
        return;
      }
      if (!body.text) {
        setLyricsState("empty");
        return;
      }
      setLyricsText(body.text);
      setLyricsState("loaded");
    } catch {
      setLyricsState("error");
      setLyricsError("Lost connection while loading lyrics.");
    }
  }

  function toggleLyrics() {
    const next = !showLyrics;
    setShowLyrics(next);
    if (next && lyricsState === "idle") {
      if (instrumental) {
        setLyricsState("empty");
      } else {
        fetchLyrics();
      }
    }
  }

  return (
    <div
      style={{ animationDelay: `${index * 90}ms` }}
      className="animate-fade-in-up rounded-2xl border border-neutral-200/80 bg-white/70 p-4 shadow-sm backdrop-blur transition-shadow hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900/60"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-sm font-medium">{track.title || "Untitled"}</span>
        <a
          href={track.audioUrl}
          download
          className="shrink-0 text-xs font-medium text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
        >
          Download
        </a>
      </div>

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio controls src={track.audioUrl} className="mt-3 w-full">
        Your browser doesn&apos;t support inline audio playback. <a href={track.audioUrl}>Download the track instead</a>.
      </audio>

      <button
        type="button"
        onClick={toggleLyrics}
        className="mt-3 text-xs font-medium text-neutral-500 underline-offset-2 transition-colors hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        {showLyrics ? "Hide lyrics" : "Show lyrics"}
      </button>

      {showLyrics && (
        <div className="mt-2 animate-fade-in rounded-lg bg-neutral-50 p-3 text-sm leading-relaxed text-neutral-700 dark:bg-neutral-950/50 dark:text-neutral-300">
          {lyricsState === "loading" && <span className="text-neutral-400">Loading lyrics…</span>}
          {lyricsState === "empty" && (
            <span className="text-neutral-400">
              {instrumental ? "Instrumental track — no lyrics." : "No lyrics available for this track."}
            </span>
          )}
          {lyricsState === "error" && (
            <span className="text-red-600 dark:text-red-400">
              {lyricsError}{" "}
              <button onClick={fetchLyrics} className="font-medium underline underline-offset-2">
                Retry
              </button>
            </span>
          )}
          {lyricsState === "loaded" && <p className="whitespace-pre-wrap">{lyricsText}</p>}
        </div>
      )}
    </div>
  );
}
