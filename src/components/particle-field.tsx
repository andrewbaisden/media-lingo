"use client";

import { useEffect, useRef } from "react";

type Particle = {
  column: number;
  span: number;
  jitter: number;
  size: number;
  color: string;
  phase: number;
  alpha: number;
  square: boolean;
  dust: boolean;
};

const COLORS = [
  "#ffffff",
  "#fdf4ff",
  "#f0abfc",
  "#e879f9",
  "#d946ef",
  "#c026d3",
  "#a21caf",
  "#9333ea",
  "#db2777",
  "#f472b6",
];

const COLUMNS = 42;
const PER_COLUMN = 88;

function envelope(column: number, time: number) {
  const along = column / (COLUMNS - 1);
  const mixed =
    Math.sin(along * Math.PI * 3.4 + time * 1.25) * 0.56 +
    Math.sin(along * Math.PI * 7.2 - time * 0.95) * 0.3 +
    Math.sin(along * Math.PI * 12.5 + time * 0.55) * 0.16;
  return Math.min(1, 0.16 + Math.abs(mixed) * 1.2);
}

function makeParticles(): Particle[] {
  const particles: Particle[] = [];

  for (let column = 0; column < COLUMNS; column += 1) {
    for (let index = 0; index < PER_COLUMN; index += 1) {
      const spark = Math.random() < 0.08;
      particles.push({
        column,
        span: ((index + Math.random() * 0.65) / PER_COLUMN) * 2 - 1,
        jitter: (Math.random() - 0.5) * 0.72,
        size: spark ? 3.6 + Math.random() * 2.4 : 1.5 + Math.random() * 2.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? "#e879f9",
        phase: Math.random() * Math.PI * 2,
        alpha: 0.62 + Math.random() * 0.38,
        square: spark || Math.random() > 0.72,
        dust: false,
      });
    }
  }

  for (let index = 0; index < 180; index += 1) {
    particles.push({
      column: 0,
      span: Math.random(),
      jitter: Math.random(),
      size: Math.random() * 1.5 + 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? "#f0abfc",
      phase: Math.random() * Math.PI * 2,
      alpha: 0.25 + Math.random() * 0.35,
      square: Math.random() > 0.65,
      dust: true,
    });
  }

  return particles;
}

export function ParticleField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let particles: Particle[] = [];
    let frame = 0;
    let animation = 0;

    function resize() {
      const width = parent?.clientWidth ?? 0;
      const height = parent?.clientHeight ?? 0;
      if (!canvas || width === 0 || height === 0) {
        return;
      }
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context?.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = makeParticles();
    }

    function draw() {
      if (!canvas || !context) {
        return;
      }
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      context.clearRect(0, 0, width, height);

      const time = motionQuery.matches ? 0.85 : frame / 48;
      const padX = width * 0.07;
      const span = width - padX * 2;
      const pitch = span / (COLUMNS - 1);
      const centerY = height * 0.5;
      const amplitude = height * 0.4;

      const glow = context.createLinearGradient(
        0,
        centerY - amplitude,
        0,
        centerY + amplitude,
      );
      glow.addColorStop(0, "rgba(217,70,239,0)");
      glow.addColorStop(0.42, "rgba(244,114,182,0.16)");
      glow.addColorStop(0.5, "rgba(255,255,255,0.55)");
      glow.addColorStop(0.58, "rgba(244,114,182,0.16)");
      glow.addColorStop(1, "rgba(217,70,239,0)");
      context.fillStyle = glow;
      context.fillRect(padX, centerY - amplitude, span, amplitude * 2);

      for (const particle of particles) {
        const flicker =
          particle.alpha *
          (0.86 + 0.14 * Math.sin(time * 1.7 + particle.phase));

        if (particle.dust) {
          context.globalAlpha = flicker;
          context.fillStyle = particle.color;
          paint(
            context,
            particle.jitter * width,
            particle.span * height,
            particle.size,
            particle.square,
          );
          continue;
        }

        const energy = envelope(particle.column, time);
        const reach = Math.abs(particle.span);
        const fade =
          reach <= energy ? 1 : Math.max(0, 1 - (reach - energy) * 10);
        if (fade <= 0) {
          continue;
        }

        const x = padX + particle.column * pitch + particle.jitter * pitch;
        const y = centerY + particle.span * amplitude;
        context.globalAlpha = flicker * fade;
        context.fillStyle = particle.color;
        paint(context, x, y, particle.size, particle.square);
      }
      context.globalAlpha = 1;

      if (motionQuery.matches) {
        return;
      }
      frame += 1;
      animation = window.requestAnimationFrame(draw);
    }

    resize();
    draw();
    const observer = new ResizeObserver(() => {
      resize();
      if (motionQuery.matches) {
        draw();
      }
    });
    observer.observe(parent);

    return () => {
      window.cancelAnimationFrame(animation);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`block h-full w-full ${className ?? ""}`}
    />
  );
}

function paint(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  square: boolean,
) {
  if (square) {
    context.fillRect(x - size / 2, y - size / 2, size, size);
    return;
  }
  context.beginPath();
  context.arc(x, y, size / 2, 0, Math.PI * 2);
  context.fill();
}
