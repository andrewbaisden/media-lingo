import "server-only";

import { VoiceboxError, VoiceboxUnavailableError } from "@/lib/errors";
import { voiceboxLanguage } from "@/lib/voicebox/language";
import {
  generationFailureMessage,
  parseGeneration,
  parseGenerationStatus,
  parseVoiceProfiles,
  type VoiceGeneration,
  type VoiceProfile,
} from "@/lib/voicebox/schemas";

const DEFAULT_URL = "http://127.0.0.1:17493";
const GENERATION_TIMEOUT_MS = 180_000;

export function voiceboxBaseUrl(): string {
  const configured = process.env.VOICEBOX_API_URL?.trim() || DEFAULT_URL;
  return configured.replace(/\/$/, "");
}

export async function getVoiceboxStatus(): Promise<{
  available: boolean;
  profiles: VoiceProfile[];
  message?: string;
}> {
  try {
    let health = await voiceboxFetch("/health", {
      timeoutMs: 2_000,
      timeoutIsOffline: true,
    });
    if (health.status === 404) {
      health = await voiceboxFetch("/", {
        timeoutMs: 2_000,
        timeoutIsOffline: true,
      });
    }
    if (!health.ok) {
      throw new VoiceboxUnavailableError();
    }
    const profilesResponse = await voiceboxFetch("/profiles", {
      timeoutMs: 5_000,
      timeoutIsOffline: true,
    });
    if (!profilesResponse.ok) {
      throw new VoiceboxError(
        "Voicebox is running, but its voice list could not be read.",
      );
    }
    const profiles = parseVoiceProfiles(await profilesResponse.json());
    if (!profiles) {
      throw new VoiceboxError("Voicebox returned an unexpected voice list.");
    }
    if (profiles.length === 0) {
      return {
        available: true,
        profiles: [],
        message:
          "Voicebox is running, but it has no voice profiles yet. Create a voice in the Voicebox app, then try again.",
      };
    }
    return { available: true, profiles };
  } catch (error) {
    if (error instanceof VoiceboxUnavailableError) {
      return { available: false, profiles: [], message: error.message };
    }
    if (isOffline(error)) {
      const offline = new VoiceboxUnavailableError();
      return { available: false, profiles: [], message: offline.message };
    }
    if (error instanceof VoiceboxError) {
      return { available: false, profiles: [], message: error.message };
    }
    const offline = new VoiceboxUnavailableError();
    return { available: false, profiles: [], message: offline.message };
  }
}

export async function generateSpeech(input: {
  text: string;
  profileId: string;
  language?: string;
  engine?: string;
}): Promise<VoiceGeneration> {
  const language = voiceboxLanguage(input.language ?? "en");
  try {
    return await createGeneration(
      input.text,
      input.profileId,
      language,
      input.engine,
    );
  } catch (error) {
    if (
      error instanceof VoiceboxError &&
      error.status === 422 &&
      language !== "en"
    ) {
      return createGeneration(input.text, input.profileId, "en", input.engine);
    }
    throw error;
  }
}

export async function readGeneratedAudio(id: string): Promise<Response> {
  if (!isGenerationId(id)) {
    throw new VoiceboxError("That audio file could not be found.", 404);
  }
  const response = await voiceboxFetch(`/audio/${id}`, {
    timeoutMs: 30_000,
    timeoutIsOffline: true,
  });
  if (response.status === 404) {
    throw new VoiceboxError("The generated speech is not ready yet.", 404);
  }
  if (!response.ok || !response.body) {
    throw new VoiceboxError("Voicebox could not return the generated speech.");
  }
  return response;
}

async function createGeneration(
  text: string,
  profileId: string,
  language: string,
  engine?: string,
): Promise<VoiceGeneration> {
  const response = await voiceboxFetch("/generate", {
    method: "POST",
    body: {
      text,
      profile_id: profileId,
      language,
      ...(engine ? { engine } : {}),
    },
    timeoutMs: 30_000,
    timeoutIsOffline: true,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw generationHttpError(response.status);
  }

  const generation = parseGeneration(payload);
  if (!generation) {
    throw new VoiceboxError(
      "Voicebox returned an unexpected generation response.",
    );
  }

  await waitForGeneration(generation.id);
  return generation;
}

async function waitForGeneration(id: string): Promise<void> {
  const response = await voiceboxFetch(`/generate/${id}/status`, {
    headers: { Accept: "text/event-stream" },
    timeoutMs: GENERATION_TIMEOUT_MS,
    timeoutIsOffline: false,
  });

  if (!response.ok || !response.body) {
    throw new VoiceboxError("Voicebox could not report generation progress.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const event of events) {
      const status = readStatusEvent(event);
      if (status?.status === "completed") {
        return;
      }
      if (status?.status === "failed" || status?.status === "not_found") {
        throw new VoiceboxError(generationFailureMessage(status.error));
      }
    }
  }

  throw new VoiceboxError(
    "Voicebox stopped reporting progress before the speech was ready.",
  );
}

function readStatusEvent(
  event: string,
): { status: string; error?: string | null } | null {
  const line = event.split("\n").find((entry) => entry.startsWith("data:"));
  if (!line) {
    return null;
  }
  try {
    return parseGenerationStatus(JSON.parse(line.slice(5).trim()));
  } catch {
    return null;
  }
}

async function voiceboxFetch(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: HeadersInit;
    timeoutMs: number;
    timeoutIsOffline: boolean;
  },
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  try {
    return await fetch(`${voiceboxBaseUrl()}${path}`, {
      method: options.method ?? "GET",
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      signal: AbortSignal.timeout(options.timeoutMs),
    });
  } catch (error) {
    if (isOffline(error)) {
      throw new VoiceboxUnavailableError();
    }
    if (isTimeout(error)) {
      throw options.timeoutIsOffline
        ? new VoiceboxUnavailableError()
        : new VoiceboxError(
            "Voicebox took too long to generate speech. Try again once the voice model has finished loading.",
          );
    }
    throw new VoiceboxError("Voicebox could not be reached.");
  }
}

function generationHttpError(status: number): VoiceboxError {
  if (status === 404) {
    return new VoiceboxError(
      "That voice is no longer available in Voicebox. Choose another voice and try again.",
      404,
    );
  }
  if (status === 422) {
    return new VoiceboxError(
      "Voicebox could not generate speech for this text.",
      422,
    );
  }
  return new VoiceboxError(
    "Voicebox could not generate speech. Check that the selected voice is installed and try again.",
    status,
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isGenerationId(id: string): boolean {
  return /^[a-zA-Z0-9-]{1,80}$/.test(id);
}

function isTimeout(error: unknown): boolean {
  return error instanceof Error && error.name === "TimeoutError";
}

function isOffline(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const cause = "cause" in error ? error.cause : undefined;
  const code =
    cause && typeof cause === "object" && "code" in cause
      ? String(cause.code)
      : "";
  return (
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "EHOSTUNREACH" ||
    error.message.toLowerCase().includes("fetch failed")
  );
}
