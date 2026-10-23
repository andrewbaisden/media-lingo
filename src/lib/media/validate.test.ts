import { describe, expect, it } from "vitest";

import {
  fileExtension,
  formatFileSize,
  sanitizeFilename,
  validateMediaFile,
} from "@/lib/media/validate";

describe("validateMediaFile", () => {
  it("accepts common audio and video files", () => {
    expect(
      validateMediaFile({ name: "clip.mp3", type: "audio/mpeg", size: 1200 }),
    ).toMatchObject({ ok: true, kind: "audio", extension: "mp3" });
    expect(
      validateMediaFile({ name: "clip.MP4", type: "video/mp4", size: 1200 }),
    ).toMatchObject({ ok: true, kind: "video", extension: "mp4" });
    expect(
      validateMediaFile({ name: "voice.m4a", type: "", size: 10 }),
    ).toMatchObject({ ok: true, kind: "audio" });
  });

  it("rejects unsupported types, empty files, and files over 100 MB", () => {
    expect(
      validateMediaFile({ name: "notes.txt", type: "text/plain", size: 12 }),
    ).toMatchObject({
      ok: false,
      message: expect.stringContaining("not supported"),
    });
    expect(
      validateMediaFile({ name: "clip.mp3", type: "audio/mpeg", size: 0 }),
    ).toMatchObject({
      ok: false,
      message: expect.stringContaining("empty"),
    });
    expect(
      validateMediaFile({
        name: "clip.mp3",
        type: "audio/mpeg",
        size: 100 * 1024 * 1024 + 1,
      }),
    ).toMatchObject({
      ok: false,
      message: expect.stringContaining("100 MB"),
    });
  });

  it("rejects a mismatched mime type", () => {
    expect(
      validateMediaFile({
        name: "clip.mp3",
        type: "application/x-msdownload",
        size: 20,
      }),
    ).toMatchObject({ ok: false });
  });
});

describe("sanitizeFilename", () => {
  it("drops directories and unsafe characters", () => {
    expect(sanitizeFilename("../../My Talk (1).mp3")).toBe("My_Talk_1_.mp3");
    expect(fileExtension("../../My Talk (1).mp3")).toBe("mp3");
  });
});

describe("formatFileSize", () => {
  it("formats bytes, kilobytes, and megabytes", () => {
    expect(formatFileSize(12)).toBe("12 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
