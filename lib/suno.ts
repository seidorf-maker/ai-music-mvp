const SUNO_API_BASE = "https://api.sunoapi.org/api/v1";

function getApiKey(): string {
  const key = process.env.SUNO_API_KEY;
  if (!key) {
    throw new Error("SUNO_API_KEY is not set. Add it to .env.local.");
  }
  return key;
}

export type GenerateParams = {
  prompt: string;
  instrumental: boolean;
  callBackUrl: string;
};

export type GenerateResponse = {
  code: number;
  msg: string;
  data: { taskId: string };
};

export async function generateTrack(params: GenerateParams): Promise<GenerateResponse> {
  const res = await fetch(`${SUNO_API_BASE}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      customMode: false,
      instrumental: params.instrumental,
      model: "V4_5",
      prompt: params.prompt,
      callBackUrl: params.callBackUrl,
    }),
  });

  const body = await res.json();
  if (!res.ok || body.code !== 200) {
    throw new Error(body.msg || `Suno API error (${res.status})`);
  }
  return body;
}

export type SunoTrack = {
  id: string;
  audioUrl: string;
  streamAudioUrl?: string;
  title: string;
  duration: number;
  tags?: string;
};

export type RecordInfoResponse = {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: string;
    response?: { sunoData: SunoTrack[] };
  };
};

export async function getGenerationStatus(taskId: string): Promise<RecordInfoResponse> {
  const res = await fetch(`${SUNO_API_BASE}/generate/record-info?taskId=${encodeURIComponent(taskId)}`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });

  const body = await res.json();
  if (!res.ok || body.code !== 200) {
    throw new Error(body.msg || `Suno API error (${res.status})`);
  }
  return body;
}
