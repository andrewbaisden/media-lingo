"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getJson } from "@/lib/processing/api";

type VoiceProfileOption = {
  id: string;
  name: string;
  engine?: string;
};

type VoiceStatus = {
  available: boolean;
  profiles: VoiceProfileOption[];
  message?: string;
};

type VoiceGeneratorProps = {
  disabled?: boolean;
  generating?: boolean;
  audioUrl?: string;
  error?: string;
  onGenerate: (profileId: string, engine?: string) => void;
};

export function VoiceGenerator({
  disabled,
  generating,
  audioUrl,
  error,
  onGenerate,
}: VoiceGeneratorProps) {
  const [status, setStatus] = useState<VoiceStatus | null>(null);
  const [profileId, setProfileId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void getJson<VoiceStatus>("/api/voicebox/status")
      .then((next) => {
        if (cancelled) {
          return;
        }
        setStatus(next);
        setProfileId((current) => current || next.profiles[0]?.id || "");
      })
      .catch((loadError: unknown) => {
        if (cancelled) {
          return;
        }
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Voicebox is not currently running. Start the local Voicebox service and try again.";
        setStatus({ available: false, profiles: [], message });
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function checkAgain() {
    setLoading(true);
    void getJson<VoiceStatus>("/api/voicebox/status")
      .then((next) => {
        setStatus(next);
        setProfileId((current) =>
          next.profiles.some((profile) => profile.id === current)
            ? current
            : next.profiles[0]?.id || "",
        );
      })
      .catch((loadError: unknown) => {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Voicebox is not currently running. Start the local Voicebox service and try again.";
        setStatus({ available: false, profiles: [], message });
        setProfileId("");
      })
      .finally(() => setLoading(false));
  }

  const notice = error || status?.message;

  return (
    <div className="flex w-full flex-col gap-3 border-t border-foreground/10 pt-4">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="voice-profile"
          className="text-[11px] font-medium tracking-[0.18em] text-foreground/55 uppercase"
        >
          Voice
        </label>
        <Select
          value={profileId}
          onValueChange={setProfileId}
          disabled={disabled || generating || !status?.profiles.length}
        >
          <SelectTrigger
            id="voice-profile"
            className="h-11 w-full rounded-full bg-white/70 px-4"
          >
            <SelectValue
              placeholder={loading ? "Checking Voicebox" : "Default"}
            />
          </SelectTrigger>
          <SelectContent>
            {status?.profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="rounded-full px-4"
          disabled={disabled || generating || !profileId || !status?.available}
          onClick={() =>
            onGenerate(
              profileId,
              status?.profiles.find((profile) => profile.id === profileId)
                ?.engine,
            )
          }
        >
          {generating ? "Generating voice" : "Generate Voice"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-full bg-white/80"
          onClick={checkAgain}
        >
          Check again
        </Button>
      </div>
      {notice ? (
        <p className="text-sm text-muted-foreground">{notice}</p>
      ) : null}
      {audioUrl ? (
        <audio src={audioUrl} controls preload="metadata" className="w-full" />
      ) : null}
    </div>
  );
}
