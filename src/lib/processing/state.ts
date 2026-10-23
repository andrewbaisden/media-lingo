import {
  DEFAULT_SOURCE_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
} from "@/lib/languages";
import type { MediaKind } from "@/lib/media/validate";

export type StepName = "upload" | "transcription" | "translation" | "voice";
export type StepStatus = "idle" | "active" | "done" | "failed";

export type MediaSelection = {
  displayName: string;
  filename: string;
  size: number;
  kind: MediaKind;
  previewUrl: string;
};

export type ProcessingState = {
  media: MediaSelection | null;
  sourceLanguage: string;
  targetLanguage: string;
  upload: StepStatus;
  transcription: StepStatus;
  translation: StepStatus;
  voice: StepStatus;
  transcript?: string;
  translatedText?: string;
  generatedAudioUrl?: string;
  error?: string;
  phaseLabel: string;
};

export type ProcessingAction =
  | { type: "set-media"; media: MediaSelection }
  | { type: "clear-media" }
  | { type: "set-source"; language: string }
  | { type: "set-target"; language: string }
  | { type: "start" }
  | { type: "uploaded" }
  | { type: "transcribing" }
  | { type: "transcript"; text: string }
  | { type: "translating" }
  | { type: "translated"; text: string }
  | { type: "voice-start" }
  | { type: "voice-ready"; audioUrl: string }
  | { type: "fail"; step: StepName; message: string }
  | { type: "reset" };

export const initialProcessingState: ProcessingState = {
  media: null,
  sourceLanguage: DEFAULT_SOURCE_LANGUAGE,
  targetLanguage: DEFAULT_TARGET_LANGUAGE,
  upload: "idle",
  transcription: "idle",
  translation: "idle",
  voice: "idle",
  phaseLabel: "Ready",
};

export function processingReducer(
  state: ProcessingState,
  action: ProcessingAction,
): ProcessingState {
  switch (action.type) {
    case "set-media":
      return {
        ...initialProcessingState,
        sourceLanguage: state.sourceLanguage,
        targetLanguage: state.targetLanguage,
        media: action.media,
      };
    case "clear-media":
      return {
        ...initialProcessingState,
        sourceLanguage: state.sourceLanguage,
        targetLanguage: state.targetLanguage,
      };
    case "set-source":
      return { ...state, sourceLanguage: action.language };
    case "set-target":
      return { ...state, targetLanguage: action.language };
    case "start":
      return {
        ...state,
        upload: "active",
        transcription: "idle",
        translation: "idle",
        voice: "idle",
        transcript: undefined,
        translatedText: undefined,
        generatedAudioUrl: undefined,
        error: undefined,
        phaseLabel: "Uploading",
      };
    case "uploaded":
      return { ...state, upload: "done", phaseLabel: "Uploaded" };
    case "transcribing":
      return {
        ...state,
        upload: "done",
        transcription: "active",
        phaseLabel: "Transcribing",
      };
    case "transcript":
      return {
        ...state,
        transcription: "done",
        transcript: action.text,
        phaseLabel: "Transcription complete",
      };
    case "translating":
      return {
        ...state,
        translation: "active",
        phaseLabel: "Translating",
      };
    case "translated":
      return {
        ...state,
        translation: "done",
        translatedText: action.text,
        phaseLabel: "Translation complete",
      };
    case "voice-start":
      return {
        ...state,
        voice: "active",
        generatedAudioUrl: undefined,
        error: undefined,
        phaseLabel: "Generating voice",
      };
    case "voice-ready":
      return {
        ...state,
        voice: "done",
        generatedAudioUrl: action.audioUrl,
        phaseLabel: "Complete",
      };
    case "fail":
      return {
        ...state,
        upload: action.step === "upload" ? "failed" : state.upload,
        transcription:
          action.step === "transcription" ? "failed" : state.transcription,
        translation:
          action.step === "translation" ? "failed" : state.translation,
        voice: action.step === "voice" ? "failed" : state.voice,
        error: action.message,
        phaseLabel: "Failed",
      };
    case "reset":
      return {
        ...initialProcessingState,
        media: state.media,
        sourceLanguage: state.sourceLanguage,
        targetLanguage: state.targetLanguage,
      };
    default:
      return state;
  }
}

export function isProcessing(state: ProcessingState): boolean {
  return (
    state.upload === "active" ||
    state.transcription === "active" ||
    state.translation === "active" ||
    state.voice === "active"
  );
}

export function stepLabel(step: StepName, status: StepStatus): string {
  const labels: Record<StepName, Record<StepStatus, string>> = {
    upload: {
      idle: "Upload",
      active: "Uploading",
      done: "Upload complete",
      failed: "Upload failed",
    },
    transcription: {
      idle: "Transcription",
      active: "Transcribing",
      done: "Transcription complete",
      failed: "Transcription failed",
    },
    translation: {
      idle: "Translation",
      active: "Translating",
      done: "Translation complete",
      failed: "Translation failed",
    },
    voice: {
      idle: "Voice generation",
      active: "Generating voice",
      done: "Voice ready",
      failed: "Voice generation failed",
    },
  };
  return labels[step][status];
}
