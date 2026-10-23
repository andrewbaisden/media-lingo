"use client";

import { useRef, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/media/validate";

type MediaDropzoneProps = {
  fileName?: string;
  fileSize?: number;
  disabled?: boolean;
  onFile: (file: File) => void;
};

export function MediaDropzone({
  fileName,
  fileSize,
  disabled,
  onFile,
}: MediaDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function takeFile(file: File | undefined) {
    if (file) {
      onFile(file);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (disabled) {
      return;
    }
    takeFile(event.dataTransfer.files[0]);
  }

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className="flex flex-col items-start gap-4 rounded-[2rem] bg-white/50 px-7 py-8 text-left ring-1 ring-foreground/10"
    >
      <div>
        <p className="font-display text-3xl leading-none tracking-tight text-[#2a1845]">
          {fileName ? fileName : "Drop audio or video"}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          {fileName && fileSize !== undefined
            ? formatFileSize(fileSize)
            : "MP3, WAV, M4A, MP4, MOV, or WebM up to 100 MB"}
        </p>
      </div>
      <input
        ref={inputRef}
        id="media-file"
        type="file"
        accept=".mp3,.wav,.m4a,.mp4,.mov,.webm,audio/*,video/*"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          takeFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="h-10 rounded-full bg-white/80 px-4"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {fileName ? "Choose another file" : "Choose file"}
      </Button>
    </div>
  );
}
