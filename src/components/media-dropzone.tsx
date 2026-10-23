"use client";

import { UploadIcon } from "lucide-react";
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
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center"
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-background ring-1 ring-foreground/10">
        <UploadIcon className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-base font-medium">
          {fileName ? fileName : "Drag audio or video here"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {fileName && fileSize !== undefined
            ? formatFileSize(fileSize)
            : "MP3, WAV, M4A, MP4, MOV, or WebM up to 100 MB"}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">or</p>
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
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {fileName ? "Choose another file" : "Choose file"}
      </Button>
    </div>
  );
}
