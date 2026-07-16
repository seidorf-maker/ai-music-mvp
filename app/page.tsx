"use client";

import { useEffect, useRef, useState } from "react";

type Track = {
  id: string;
  audioUrl: string;
  title: string;
  duration: number;
  tags?: string;
};

type Phase = "idle" | "submitting" | "processing" | "completed" | "failed";

const POLL_INTERVAL_MS = 5000;
const MAX_POLLS = 90; // ~7.5 minutes

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [instrumental, setInstrumental] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const pollCount = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  function stopPolling() {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }

  async function pollStatus(taskId: string) {
    pollCount.current += 1;
    if (pollCount.current > MAX_POLLS) {
      setPhase("failed");
      setError("Generation is taking longer than expected. Try again in a moment.");
      return;
    }

    try {
      const res = await fetch(`/api/status/${taskId}`);
      const body = await res.json();

      if (!res.ok) {
        setPhase("failed");
        setError(body.error || "Something went wrong checking generation status.");
        return;
      }

      if (body.state === "completed") {
        setTracks(body.tracks);
        setPhase("completed");
        return;
      }

      if (body.state === "failed") {
        setPhase("failed");
        setError(`Generation failed (provider status: ${body.providerStatus}). No retry charge was made on your side.`);
        return;
      }

      pollTimer.current = setTimeout(() => pollStatus(taskId), POLL_INTERVAL_MS);
    } catch {
      setPhase("failed");
      setError("Lost connection while checking generation status. Try again.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || phase === "submitting" || phase === "processing") return;

    setError(null);
    setTracks([]);
    setPhase("submitting");
    pollCount.current = 0;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, instrumental }),
      });
      const body = await res.json();

      if (!res.ok) {
        setPhase("failed");
        setError(body.error || "Could not start generation.");
        return;
      }

      setPhase("processing");
      pollTimer.current = setTimeout(() => pollStatus(body.taskId), POLL_INTERVAL_MS);
    } catch {
      setPhase("failed");
      setError("Could not reach the server. Check your connection and try again.");
    }
  }

  function reset() {
    stopPolling();
    setPhase("idle");
    setError(null);
    setTracks([]);
  }

  const isBusy = phase === "submitting" || phase === "processing";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-16">
      <header>
        <h1 className="text-2xl font-semibold">AI Music Creation — MVP</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Describe a song. Generation takes 1–3 minutes.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Prompt</span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={500}
            rows={4}
            disabled={isBusy}
            placeholder="A warm, upbeat lofi hip-hop track with soft piano and vinyl crackle"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900"
          />
          <span className="self-end text-xs text-neutral-400">{prompt.length}/500</span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={instrumental}
            onChange={(e) => setInstrumental(e.target.checked)}
            disabled={isBusy}
          />
          Instrumental only (no vocals)
        </label>

        <button
          type="submit"
          disabled={!prompt.trim() || isBusy}
          className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-900"
        >
          {phase === "submitting" && "Starting generation…"}
          {phase === "processing" && "Generating… this can take a couple minutes"}
          {(phase === "idle" || phase === "completed" || phase === "failed") && "Generate track"}
        </button>
      </form>

      {phase === "processing" && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400" role="status" aria-live="polite">
          Still working — checking again every few seconds. Feel free to leave this tab open.
        </p>
      )}

      {phase === "failed" && error && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {error}
          <button onClick={reset} className="ml-2 font-medium underline underline-offset-2">
            Try again
          </button>
        </div>
      )}

      {phase === "completed" && tracks.length > 0 && (
        <section aria-live="polite" className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Done — {tracks.length} version{tracks.length > 1 ? "s" : ""} generated
          </h2>
          {tracks.map((track) => (
            <div
              key={track.id}
              className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{track.title || "Untitled"}</span>
                <a
                  href={track.audioUrl}
                  download
                  className="text-xs font-medium underline underline-offset-2"
                >
                  Download
                </a>
              </div>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls src={track.audioUrl} className="w-full">
                Your browser doesn&apos;t support inline audio playback.{" "}
                <a href={track.audioUrl}>Download the track instead</a>.
              </audio>
            </div>
          ))}
          <button onClick={reset} className="self-start text-sm underline underline-offset-2">
            Generate another
          </button>
        </section>
      )}
    </main>
  );
}
