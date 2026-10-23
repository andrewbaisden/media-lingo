"use client";

import { useEffect, useReducer, useRef, useState } from "react";

import { ErrorAlert } from "@/components/error-alert";
import { LanguageSelector } from "@/components/language-selector";
import { MediaDropzone } from "@/components/media-dropzone";
import { MediaPreview } from "@/components/media-preview";
import { ProcessingProgress } from "@/components/processing-progress";
import {
  Eyebrow,
  pillClassName,
  SiteFooter,
  SiteHeader,
  SiteHero,
  StudioOrb,
} from "@/components/site-frame";
import { TranscriptPanel } from "@/components/transcript-panel";
import { VoiceGenerator } from "@/components/voice-generator";
import { Button } from "@/components/ui/button";
import {
  isSameSpokenLanguage,
  languageLabel,
  sameLanguageMessage,
  sourceLanguages,
  targetLanguages,
} from "@/lib/languages";
import { validateMediaFile } from "@/lib/media/validate";
import { pollOrder, postJson } from "@/lib/processing/api";
import {
  initialProcessingState,
  isProcessing,
  processingReducer,
  type StepName,
} from "@/lib/processing/state";

export function MediaLingoApp() {
  // The browser test waits for this after hydration. The server render has no window.
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem("medialingo-ready", "1");
  }
  const [state, dispatch] = useReducer(
    processingReducer,
    initialProcessingState,
  );
  const [formError, setFormError] = useState<string>();
  const fileRef = useRef<File | null>(null);
  const previewRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const busy = isProcessing(state);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  function rememberPreview(url: string | null) {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
    }
    previewRef.current = url;
  }

  function chooseFile(file: File) {
    const result = validateMediaFile(file);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    rememberPreview(previewUrl);
    fileRef.current = file;
    setFormError(undefined);
    dispatch({
      type: "set-media",
      media: {
        displayName: file.name.split(/[/\\]/).pop() || file.name,
        filename: result.filename,
        size: file.size,
        kind: result.kind,
        previewUrl,
      },
    });
  }

  async function processMedia() {
    const file = fileRef.current;
    if (!file || !state.media) {
      setFormError("Choose an audio or video file.");
      return;
    }

    if (isSameSpokenLanguage(state.sourceLanguage, state.targetLanguage)) {
      setFormError(
        sameLanguageMessage(state.sourceLanguage, state.targetLanguage),
      );
      return;
    }

    setFormError(undefined);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;
    let step: StepName = "upload";

    dispatch({ type: "start" });

    try {
      const upload = await postJson<{ signedUrl: string }>(
        "/api/happyscribe/upload-url",
        { filename: state.media.filename },
        signal,
      );
      const putResponse = await fetch(upload.signedUrl, {
        method: "PUT",
        body: file,
        signal,
      });
      if (!putResponse.ok) {
        throw new Error(
          "The file could not be uploaded to HappyScribe. Try again.",
        );
      }

      dispatch({ type: "uploaded" });
      const order = await postJson<{ id: string }>(
        "/api/happyscribe/orders",
        {
          url: upload.signedUrl,
          language: state.sourceLanguage,
          name: state.media.filename,
        },
        signal,
      );

      step = "transcription";
      dispatch({ type: "transcribing" });
      const transcriptionId = await pollOrder(order.id, signal);
      const transcript = await postJson<{ text: string }>(
        "/api/happyscribe/exports",
        { transcriptionId },
        signal,
      );
      dispatch({ type: "transcript", text: transcript.text });

      step = "translation";
      dispatch({ type: "translating" });
      const translation = await postJson<{ id: string }>(
        "/api/happyscribe/translations",
        {
          transcriptionId,
          targetLanguage: state.targetLanguage,
          sourceLanguage: state.sourceLanguage,
        },
        signal,
      );
      const translatedId = await pollOrder(translation.id, signal);
      const translated = await postJson<{ text: string }>(
        "/api/happyscribe/exports",
        { transcriptionId: translatedId },
        signal,
      );
      dispatch({ type: "translated", text: translated.text });
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      dispatch({
        type: "fail",
        step,
        message: pipelineErrorMessage(error, step),
      });
    }
  }

  async function generateVoice(profileId: string, engine?: string) {
    if (!state.translatedText) {
      return;
    }
    dispatch({ type: "voice-start" });
    try {
      const result = await postJson<{ audioUrl: string }>(
        "/api/voicebox/generate",
        {
          text: state.translatedText,
          profileId,
          language: state.targetLanguage,
          ...(engine ? { engine } : {}),
        },
      );
      dispatch({ type: "voice-ready", audioUrl: result.audioUrl });
    } catch (error) {
      dispatch({
        type: "fail",
        step: "voice",
        message:
          error instanceof Error
            ? error.message
            : "Voicebox could not generate speech. Try again.",
      });
    }
  }

  const pipelineError = state.voice === "failed" ? undefined : state.error;
  const showProgress = state.upload !== "idle" || state.phaseLabel === "Failed";

  return (
    <div id="top" className="relative flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <SiteHero />
      <main
        id="studio"
        className="mx-auto flex w-full max-w-7xl scroll-mt-24 flex-1 flex-col gap-14 px-6 py-16 lg:px-10"
      >
        <div className="grid items-end gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex flex-col items-start gap-4">
            <Eyebrow>Your file</Eyebrow>
            <h2 className="font-display text-[clamp(3rem,5vw,4.75rem)] leading-[0.9] tracking-[-0.03em] text-[#2a1845]">
              <span className="italic">Bring</span> a recording.
            </h2>
            <p className="max-w-sm text-sm leading-6 text-foreground/65">
              Add audio or video, choose the source language and the language
              you want, then process it.
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <MediaDropzone
              fileName={state.media?.displayName}
              fileSize={state.media?.size}
              disabled={busy}
              onFile={chooseFile}
            />
            {state.media ? (
              <MediaPreview
                src={state.media.previewUrl}
                kind={state.media.kind}
                name={state.media.displayName}
              />
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <LanguageSelector
                id="source-language"
                label="Source"
                value={state.sourceLanguage}
                options={sourceLanguages}
                disabled={busy}
                onChange={(language) => {
                  setFormError(undefined);
                  dispatch({ type: "set-source", language });
                }}
              />
              <LanguageSelector
                id="target-language"
                label="Translate to"
                value={state.targetLanguage}
                options={targetLanguages}
                disabled={busy}
                onChange={(language) => {
                  setFormError(undefined);
                  dispatch({ type: "set-target", language });
                }}
              />
            </div>
            {isSameSpokenLanguage(
              state.sourceLanguage,
              state.targetLanguage,
            ) ? (
              <p className="text-sm text-muted-foreground">
                {sameLanguageMessage(
                  state.sourceLanguage,
                  state.targetLanguage,
                )}
              </p>
            ) : null}
            <div>
              <Button
                type="button"
                className={pillClassName}
                disabled={
                  busy ||
                  !state.media ||
                  isSameSpokenLanguage(
                    state.sourceLanguage,
                    state.targetLanguage,
                  )
                }
                onClick={() => void processMedia()}
              >
                {busy && state.voice !== "active"
                  ? state.phaseLabel
                  : "Process"}
              </Button>
            </div>
          </div>
        </div>

        {formError ? <ErrorAlert message={formError} /> : null}
        {pipelineError ? <ErrorAlert message={pipelineError} /> : null}
        {showProgress ? (
          <ProcessingProgress
            phaseLabel={state.phaseLabel}
            statuses={{
              upload: state.upload,
              transcription: state.transcription,
              translation: state.translation,
              voice: state.voice,
            }}
          />
        ) : null}

        {state.transcript !== undefined || state.translation === "active" ? (
          <section className="grid gap-4 md:grid-cols-2">
            <TranscriptPanel
              title="Original transcript"
              description={languageLabel(sourceLanguages, state.sourceLanguage)}
              text={state.transcript}
              pendingLabel="Preparing the transcript."
              downloadName="original-transcript.txt"
            />
            <TranscriptPanel
              title="Translated transcript"
              description={languageLabel(targetLanguages, state.targetLanguage)}
              text={state.translatedText}
              pendingLabel={
                state.translation === "active"
                  ? "Translating."
                  : "Waiting for the translation."
              }
              downloadName="translated-transcript.txt"
            >
              {state.translatedText ? (
                <VoiceGenerator
                  disabled={busy && state.voice !== "active"}
                  generating={state.voice === "active"}
                  audioUrl={state.generatedAudioUrl}
                  error={state.voice === "failed" ? state.error : undefined}
                  onGenerate={(profileId, engine) =>
                    void generateVoice(profileId, engine)
                  }
                />
              ) : null}
            </TranscriptPanel>
          </section>
        ) : null}
      </main>
      <SiteFooter />
      <StudioOrb />
    </div>
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function pipelineErrorMessage(error: unknown, step: StepName): string {
  if (error instanceof TypeError) {
    return step === "upload"
      ? "The file could not be uploaded to HappyScribe. Try again."
      : "The server could not be reached. Try again.";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong. Try again.";
}
