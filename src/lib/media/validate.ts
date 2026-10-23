export const MAX_FILE_BYTES = 100 * 1024 * 1024;

const EXTENSIONS = {
  mp3: {
    kind: "audio",
    mimes: ["audio/mpeg", "audio/mp3"],
  },
  wav: {
    kind: "audio",
    mimes: ["audio/wav", "audio/wave", "audio/x-wav"],
  },
  m4a: {
    kind: "audio",
    mimes: ["audio/mp4", "audio/x-m4a", "audio/m4a"],
  },
  mp4: {
    kind: "video",
    mimes: ["video/mp4", "audio/mp4", "application/mp4"],
  },
  mov: {
    kind: "video",
    mimes: ["video/quicktime"],
  },
  webm: {
    kind: "video",
    mimes: ["video/webm", "audio/webm"],
  },
} as const;

export type MediaExtension = keyof typeof EXTENSIONS;
export type MediaKind = "audio" | "video";

export type MediaValidation =
  | {
      ok: true;
      filename: string;
      extension: MediaExtension;
      kind: MediaKind;
    }
  | {
      ok: false;
      message: string;
    };

const UNSUPPORTED_MESSAGE =
  "This file type is not supported. Use MP3, WAV, M4A, MP4, MOV, or WebM.";

export function fileExtension(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "";
  const match = /\.([a-z0-9]+)$/i.exec(base);
  return match?.[1]?.toLowerCase() ?? "";
}

export function sanitizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "media";
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 120);
  return cleaned || "media";
}

export function mediaKindFor(
  extension: MediaExtension,
  mimeType: string,
): MediaKind {
  if (mimeType.startsWith("audio/")) {
    return "audio";
  }
  if (mimeType.startsWith("video/")) {
    return "video";
  }
  return EXTENSIONS[extension].kind;
}

export function validateMediaFile(file: {
  name: string;
  type: string;
  size: number;
}): MediaValidation {
  if (!file.name.trim()) {
    return { ok: false, message: "Choose an audio or video file." };
  }

  if (file.size <= 0) {
    return { ok: false, message: "That file is empty." };
  }

  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      message: "This file is too large. MediaLingo accepts files up to 100 MB.",
    };
  }

  const extension = fileExtension(file.name);
  if (!isMediaExtension(extension)) {
    return { ok: false, message: UNSUPPORTED_MESSAGE };
  }

  const mimeType = file.type.trim().toLowerCase();
  const allowedMimes: readonly string[] = EXTENSIONS[extension].mimes;
  const mimeIsGeneric =
    mimeType.length === 0 || mimeType === "application/octet-stream";

  if (!mimeIsGeneric && !allowedMimes.includes(mimeType)) {
    return { ok: false, message: UNSUPPORTED_MESSAGE };
  }

  return {
    ok: true,
    filename: sanitizeFilename(file.name),
    extension,
    kind: mediaKindFor(extension, mimeType),
  };
}

function isMediaExtension(value: string): value is MediaExtension {
  return Object.hasOwn(EXTENSIONS, value);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
