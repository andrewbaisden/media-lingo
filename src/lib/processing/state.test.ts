import { describe, expect, it } from "vitest";

import {
  initialProcessingState,
  processingReducer,
  stepLabel,
} from "@/lib/processing/state";

describe("processingReducer", () => {
  it("moves from upload through translation", () => {
    const started = processingReducer(initialProcessingState, {
      type: "start",
    });
    expect(started.phaseLabel).toBe("Uploading");
    expect(started.upload).toBe("active");

    const transcribed = processingReducer(started, {
      type: "transcript",
      text: "Hello",
    });
    expect(transcribed.transcript).toBe("Hello");
    expect(transcribed.transcription).toBe("done");

    const translated = processingReducer(transcribed, {
      type: "translated",
      text: "Hola",
    });
    expect(translated.phaseLabel).toBe("Translation complete");
    expect(translated.translatedText).toBe("Hola");
  });

  it("keeps the transcript when voice generation fails", () => {
    const ready = processingReducer(initialProcessingState, {
      type: "translated",
      text: "Hola",
    });
    const failed = processingReducer(ready, {
      type: "fail",
      step: "voice",
      message:
        "Voicebox is not currently running. Start the local Voicebox service and try again.",
    });
    expect(failed.translatedText).toBe("Hola");
    expect(failed.voice).toBe("failed");
    expect(failed.phaseLabel).toBe("Failed");
  });

  it("labels timeline steps", () => {
    expect(stepLabel("upload", "done")).toBe("Upload complete");
    expect(stepLabel("translation", "active")).toBe("Translating");
    expect(stepLabel("voice", "idle")).toBe("Voice generation");
  });
});
