import { describe, expect, it } from "vitest";

import { happyScribeStatusMessage } from "@/lib/errors";
import {
  DEFAULT_TARGET_LANGUAGE,
  isSameSpokenLanguage,
  isSourceLanguage,
  isTargetLanguage,
  languageLabel,
  sourceLanguages,
  targetLanguages,
} from "@/lib/languages";
import { voiceboxLanguage } from "@/lib/voicebox/language";

describe("languages", () => {
  it("keeps source codes regional and translation codes short", () => {
    expect(sourceLanguages.map((language) => language.code)).toContain("en-US");
    expect(targetLanguages.map((language) => language.code)).toEqual([
      "en",
      "es",
      "fr",
      "de",
      "it",
      "pt-BR",
      "pt-PT",
      "nl",
      "ja",
      "ko",
    ]);
    expect(isSourceLanguage("en-US")).toBe(true);
    expect(isSourceLanguage("auto")).toBe(false);
    expect(isTargetLanguage(DEFAULT_TARGET_LANGUAGE)).toBe(true);
    expect(isTargetLanguage("es-ES")).toBe(false);
    expect(languageLabel(targetLanguages, "pt-PT")).toBe(
      "Portuguese (Portugal)",
    );
    expect(isSameSpokenLanguage("en-US", "en")).toBe(true);
    expect(isSameSpokenLanguage("en-US", "es")).toBe(false);
    expect(isSameSpokenLanguage("pt-BR", "pt-PT")).toBe(false);
  });
});

describe("happyScribeStatusMessage", () => {
  it("turns upstream status codes into readable errors", () => {
    expect(happyScribeStatusMessage(401)).toContain("HAPPYSCRIBE_API_KEY");
    expect(happyScribeStatusMessage(429, 30)).toContain("30 seconds");
    expect(happyScribeStatusMessage(500)).toContain("temporarily unavailable");
    expect(happyScribeStatusMessage(422)).not.toContain("{");
  });
});

describe("voiceboxLanguage", () => {
  it("maps translation codes onto Voicebox language codes", () => {
    expect(voiceboxLanguage("pt-BR")).toBe("pt");
    expect(voiceboxLanguage("pt-PT")).toBe("pt");
    expect(voiceboxLanguage("ja")).toBe("ja");
    expect(voiceboxLanguage("xx")).toBe("en");
  });
});
