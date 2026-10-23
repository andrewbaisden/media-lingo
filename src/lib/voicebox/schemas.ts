import { z } from "zod";

const voiceboxEngines = [
  "qwen",
  "qwen_custom_voice",
  "luxtts",
  "chatterbox",
  "chatterbox_turbo",
  "tada",
  "kokoro",
] as const;

export const voiceProfileSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  language: z.string().nullish(),
  voice_type: z.string().nullish(),
  default_engine: z.string().nullish(),
  preset_engine: z.string().nullish(),
});

export const voiceProfilesSchema = z.array(voiceProfileSchema);

export const generationSchema = z.looseObject({
  id: z.string(),
  status: z.string().nullish(),
  error: z.string().nullish(),
});

export const generationStatusSchema = z.looseObject({
  id: z.string().optional(),
  status: z.string(),
  error: z.string().nullish(),
});

export const generateRequestSchema = z.object({
  text: z.string().trim().min(1).max(50_000),
  profileId: z.string().trim().min(1).max(80),
  language: z.string().trim().min(2).max(16).optional(),
  engine: z.enum(voiceboxEngines).optional(),
});

export type VoiceProfile = z.infer<typeof voiceProfileSchema>;
export type VoiceGeneration = z.infer<typeof generationSchema>;

export function parseVoiceProfiles(data: unknown): VoiceProfile[] | null {
  const parsed = voiceProfilesSchema.safeParse(data);
  if (!parsed.success) {
    return null;
  }
  return parsed.data
    .filter((profile) => profile.voice_type !== "import")
    .sort(
      (left, right) =>
        Number(left.voice_type !== "preset") -
        Number(right.voice_type !== "preset"),
    );
}

export function profileEngine(profile: {
  default_engine?: string | null;
  preset_engine?: string | null;
}): (typeof voiceboxEngines)[number] | undefined {
  const engine = profile.default_engine || profile.preset_engine || "";
  return voiceboxEngines.find((candidate) => candidate === engine);
}

export function generationFailureMessage(
  error: string | null | undefined,
): string {
  const detail = error?.replace(/\s+/g, " ").trim();
  if (detail && /no Stream\(gpu/i.test(detail)) {
    return "Voicebox could not speak with this voice. The Qwen engine failed on this Mac. Choose Alloy and try again.";
  }
  if (detail && detail.length <= 160 && !/[\\/]/.test(detail)) {
    return `Voicebox could not generate speech. ${detail}`;
  }
  return "Voicebox could not generate speech. Check that the selected voice is installed and try again.";
}

export function parseGeneration(data: unknown): VoiceGeneration | null {
  const parsed = generationSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

export function parseGenerationStatus(data: unknown) {
  const parsed = generationStatusSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}
