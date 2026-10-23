export type LanguageOption = {
  code: string;
  label: string;
};

export const sourceLanguages = [
  { code: "en-US", label: "English" },
  { code: "es-ES", label: "Spanish" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "it-IT", label: "Italian" },
  { code: "pt-BR", label: "Portuguese" },
  { code: "nl-NL", label: "Dutch" },
  { code: "ja-JP", label: "Japanese" },
  { code: "ko-KR", label: "Korean" },
] as const satisfies readonly LanguageOption[];

export const targetLanguages = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt-BR", label: "Portuguese (Brazil)" },
  { code: "pt-PT", label: "Portuguese (Portugal)" },
  { code: "nl", label: "Dutch" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
] as const satisfies readonly LanguageOption[];

export const DEFAULT_SOURCE_LANGUAGE = sourceLanguages[0].code;
export const DEFAULT_TARGET_LANGUAGE = "es";

const sourceCodes = new Set<string>(
  sourceLanguages.map((language) => language.code),
);
const targetCodes = new Set<string>(
  targetLanguages.map((language) => language.code),
);

export function isSourceLanguage(code: string): boolean {
  return sourceCodes.has(code);
}

export function isTargetLanguage(code: string): boolean {
  return targetCodes.has(code);
}

export function languageLabel(
  options: readonly LanguageOption[],
  code: string,
): string {
  return options.find((language) => language.code === code)?.label ?? code;
}

export function isSameSpokenLanguage(source: string, target: string): boolean {
  const sourceBase = source.toLowerCase().split("-")[0] ?? "";
  const [targetBase = "", targetRegion = ""] = target.toLowerCase().split("-");
  if (!sourceBase || sourceBase !== targetBase) {
    return false;
  }
  if (!targetRegion) {
    return true;
  }
  const sourceRegion = source.toLowerCase().slice(sourceBase.length + 1);
  return targetRegion === sourceRegion;
}

export function sameLanguageMessage(source: string, target: string): string {
  const sourceLabel = languageLabel(sourceLanguages, source);
  const targetLabel = languageLabel(targetLanguages, target);
  return `HappyScribe cannot translate ${sourceLabel} into ${targetLabel}. Choose a different language.`;
}
