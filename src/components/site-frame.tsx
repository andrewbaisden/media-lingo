import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

import { ParticleField } from "@/components/particle-field";

const NAV = [
  { href: "#studio", label: "Studio" },
  { href: "#voice", label: "Voice" },
  { href: "#steps", label: "Steps" },
];

export const pillClassName =
  "inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-[#ddd6fe] to-[#c4b5fd] px-6 text-[15px] font-medium text-[#2e1065] shadow-[0_10px_30px_rgba(139,92,246,0.22)] transition-colors hover:from-[#c4b5fd] hover:to-[#a78bfa]";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#6d28d9] px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-white uppercase">
      {children}
    </span>
  );
}

function NavLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="Page" className={className}>
      {NAV.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="text-[11px] font-medium tracking-[0.22em] text-foreground/70 uppercase transition-colors hover:text-foreground"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/70 backdrop-blur-md">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-6 py-5 md:grid-cols-[1fr_auto_1fr] lg:px-10">
        <a
          href="#top"
          className="font-display text-[1.65rem] leading-none tracking-tight text-[#7c3aed]"
        >
          medialingo
        </a>
        <NavLinks className="hidden items-center gap-8 md:flex" />
        <a
          href="#studio"
          className={`${pillClassName} h-10 justify-self-end px-4 text-sm`}
        >
          Let’s begin
          <ArrowUpRight className="size-4" />
        </a>
      </div>
      <NavLinks className="flex items-center justify-center gap-6 pb-3 md:hidden" />
    </header>
  );
}

export function SiteHero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_48%_at_28%_46%,oklch(0.86_0.09_325/0.85),transparent_70%),radial-gradient(ellipse_40%_32%_at_78%_30%,oklch(0.9_0.05_290/0.7),transparent_72%)]"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-4 px-6 pt-4 pb-10 lg:min-h-[calc(100svh-5.5rem)] lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pt-0 lg:pb-16">
        <div className="relative order-1 mx-auto h-64 w-full max-w-sm lg:order-1 lg:aspect-square lg:h-auto lg:max-w-[640px]">
          <ParticleField />
        </div>
        <div className="order-2 flex flex-col items-start gap-6 lg:order-2 lg:pb-8">
          <Eyebrow>Translate</Eyebrow>
          <h1 className="font-display text-[clamp(3.5rem,7vw,6.6rem)] leading-[0.86] font-normal tracking-[-0.035em] text-[#2a1845]">
            <span className="italic">Hear</span> it
            <br />
            in any
            <br />
            language
          </h1>
          <p className="max-w-sm text-[11px] leading-5 tracking-[0.16em] text-foreground/60 uppercase">
            Upload a recording. MediaLingo writes the transcript, translates it,
            and speaks it back.
          </p>
          <a href="#studio" className={pillClassName}>
            Add a file
            <ArrowUpRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

const STEP_ITEMS = [
  ["01", "Upload the file"],
  ["02", "Transcribe"],
  ["03", "Translate"],
  ["04", "Speak it back"],
] as const;

const VOICE_ITEMS = [
  ["01", "Local Voicebox"],
  ["02", "Preset voices"],
  ["03", "Spoken translation"],
] as const;

function IndexList({
  id,
  title,
  items,
}: {
  id?: string;
  title: string;
  items: readonly (readonly [string, string])[];
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <h2 className="text-[11px] font-medium tracking-[0.2em] text-foreground/45 uppercase">
        {title}
      </h2>
      <ul className="mt-4 flex flex-col gap-2.5">
        {items.map(([index, label]) => (
          <li
            key={index}
            className="text-[13px] tracking-[0.08em] text-foreground/55 uppercase"
          >
            <span className="mr-2 text-foreground/35">[{index}]</span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:px-10">
      <p className="max-w-xs text-[11px] leading-5 tracking-[0.16em] text-foreground/55 uppercase">
        Have a recording, a clip, or a conversation? MediaLingo turns it into
        words you can read and hear.
      </p>
      <div className="grid gap-10 sm:grid-cols-2">
        <IndexList id="steps" title="Steps" items={STEP_ITEMS} />
        <IndexList id="voice" title="Voice" items={VOICE_ITEMS} />
      </div>
    </footer>
  );
}

export function StudioOrb() {
  return (
    <a
      href="#studio"
      aria-label="Go to the studio"
      className="fixed right-5 bottom-5 z-40 size-14 overflow-hidden rounded-full bg-[conic-gradient(from_140deg,#ddd6fe,#f0abfc,#818cf8,#c4b5fd,#f9a8d4,#ddd6fe)] shadow-[0_12px_32px_rgba(139,92,246,0.45)] ring-2 ring-white/80"
    >
      <span className="absolute inset-[22%] rounded-full bg-white/50 blur-[1px]" />
    </a>
  );
}
