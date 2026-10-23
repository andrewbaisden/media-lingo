import { describe, expect, it } from "vitest";

import {
  generationFailureMessage,
  parseVoiceProfiles,
  profileEngine,
} from "@/lib/voicebox/schemas";

describe("voice profiles", () => {
  it("hides imported voices and lists preset voices first", () => {
    const profiles = parseVoiceProfiles([
      {
        id: "clone",
        name: "Girl test",
        voice_type: "cloned",
        default_engine: null,
      },
      {
        id: "preset",
        name: "Alloy",
        voice_type: "preset",
        preset_engine: "kokoro",
      },
      { id: "import", name: "Imported", voice_type: "import" },
    ]);

    expect(profiles?.map((profile) => profile.name)).toEqual([
      "Alloy",
      "Girl test",
    ]);
    expect(profileEngine(profiles![0]!)).toBe("kokoro");
    expect(profileEngine(profiles![1]!)).toBeUndefined();
  });

  it("explains the Qwen graphics failure", () => {
    expect(
      generationFailureMessage("There is no Stream(gpu, 1) in current thread."),
    ).toContain("Choose Alloy");
  });
});
