const VOICEBOX_LANGUAGES = new Set([
  "zh",
  "en",
  "ja",
  "ko",
  "de",
  "fr",
  "ru",
  "pt",
  "es",
  "it",
  "he",
  "ar",
  "da",
  "el",
  "fi",
  "hi",
  "ms",
  "nl",
  "no",
  "pl",
  "sv",
  "sw",
  "tr",
]);

export const VOICEBOX_MAX_CHARACTERS = 50_000;

export function voiceboxLanguage(targetLanguage: string): string {
  const base = targetLanguage.toLowerCase().split("-")[0] ?? "";
  return VOICEBOX_LANGUAGES.has(base) ? base : "en";
}
