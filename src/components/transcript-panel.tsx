"use client";

import { CopyIcon, DownloadIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TranscriptPanelProps = {
  title: string;
  description: string;
  text?: string;
  pendingLabel?: string;
  downloadName: string;
  children?: ReactNode;
};

export function TranscriptPanel({
  title,
  description,
  text,
  pendingLabel,
  downloadName,
  children,
}: TranscriptPanelProps) {
  const [copied, setCopied] = useState(false);
  const trimmed = text?.trim();
  const body =
    text === undefined
      ? undefined
      : trimmed || "No words were detected in this file.";

  async function copyText() {
    if (!trimmed) {
      return;
    }
    await navigator.clipboard.writeText(trimmed);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function downloadText() {
    if (!trimmed) {
      return;
    }
    const blob = new Blob([trimmed], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="min-w-0 bg-white/55 shadow-none ring-foreground/10">
      <CardHeader>
        <CardTitle className="font-display text-3xl font-normal tracking-tight text-[#2a1845]">
          {title}
        </CardTitle>
        <CardDescription className="tracking-[0.14em] uppercase">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div
          data-testid={
            title === "Original transcript"
              ? "original-transcript"
              : "translated-transcript"
          }
          className="max-h-80 min-h-32 overflow-auto rounded-[1.25rem] bg-white/70 p-4 text-sm leading-6 whitespace-pre-wrap"
        >
          {body ?? pendingLabel ?? "Waiting for text."}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full bg-white/80"
            disabled={!trimmed}
            onClick={() => void copyText()}
          >
            <CopyIcon />
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full bg-white/80"
            disabled={!trimmed}
            onClick={downloadText}
          >
            <DownloadIcon />
            Download .txt
          </Button>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
