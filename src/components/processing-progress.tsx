"use client";

import { CheckIcon, CircleIcon, LoaderCircleIcon, XIcon } from "lucide-react";

import {
  stepLabel,
  type StepName,
  type StepStatus,
} from "@/lib/processing/state";

const STEPS: StepName[] = ["upload", "transcription", "translation", "voice"];

type ProcessingProgressProps = {
  phaseLabel: string;
  statuses: Record<StepName, StepStatus>;
};

export function ProcessingProgress({
  phaseLabel,
  statuses,
}: ProcessingProgressProps) {
  return (
    <section aria-label="Processing progress" className="flex flex-col gap-5">
      <h2 className="font-display text-3xl tracking-tight text-[#2a1845]">
        {phaseLabel}
      </h2>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => {
          const status = statuses[step];
          return (
            <li key={step} className="flex items-center gap-2 text-sm">
              <StepMark status={status} />
              <span
                className={
                  status === "idle" ? "text-foreground/45" : "text-foreground"
                }
              >
                <span className="mr-1.5 text-foreground/35">
                  [{String(index + 1).padStart(2, "0")}]
                </span>
                {stepLabel(step, status)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function StepMark({ status }: { status: StepStatus }) {
  if (status === "done") {
    return (
      <span className="flex size-5 items-center justify-center rounded-full bg-[#6d28d9] text-white">
        <CheckIcon className="size-3" />
      </span>
    );
  }
  if (status === "active") {
    return <LoaderCircleIcon className="size-5 animate-spin" />;
  }
  if (status === "failed") {
    return (
      <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-white">
        <XIcon className="size-3" />
      </span>
    );
  }
  return <CircleIcon className="size-5 text-muted-foreground" />;
}
