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
        className="max-h-80 w-full rounded-[1.25rem] bg-[#2a1845]"
      >
        {name}
      </video>
    );
  }

  return <audio src={src} controls preload="metadata" className="w-full" />;
}
