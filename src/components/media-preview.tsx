"use client";

import type { MediaKind } from "@/lib/media/validate";

type MediaPreviewProps = {
  src: string;
  kind: MediaKind;
  name: string;
};

export function MediaPreview({ src, kind, name }: MediaPreviewProps) {
  if (kind === "video") {
    return (
      <video
        src={src}
        controls
        preload="metadata"
        className="max-h-80 w-full rounded-lg bg-black"
      >
        {name}
      </video>
    );
  }

  return <audio src={src} controls preload="metadata" className="w-full" />;
}
