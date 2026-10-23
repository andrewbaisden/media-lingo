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
    <section aria-label="Processing progress" className="flex flex-col gap-4">
      <h2 className="text-sm font-medium text-muted-foreground">
        {phaseLabel}
      </h2>
      <ol className="grid gap-3 sm:grid-cols-4">
        {STEPS.map((step) => {
          const status = statuses[step];
          return (
            <li key={step} className="flex items-center gap-2 text-sm">
              <StepMark status={status} />
              <span
                className={status === "idle" ? "text-muted-foreground" : ""}
              >
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
      <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-background">
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
