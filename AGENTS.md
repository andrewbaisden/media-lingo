<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MediaLingo

MediaLingo transcribes an audio or video file, translates the transcript, and speaks the translation. HappyScribe handles transcription and translation. Voicebox handles speech. Do not add auth, a database, billing, or dubbing.

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Put `HAPPYSCRIBE_API_KEY` in `.env.local`. When `HAPPYSCRIBE_ORGANIZATION_ID` is empty, use the first workspace from `GET /organizations`.

Voicebox is part of the stack. Install the Apple Silicon build from https://voicebox.sh/download/mac-arm, open it, and create a voice profile. The local API defaults to `http://127.0.0.1:17493` via `VOICEBOX_API_URL`. Do not install Voicebox, Docker, or model downloads unless the user asks.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Git

- **Conventional Commits** for every commit: `type(scope): summary` in the imperative mood, ≤72 chars, lowercase type. Types: `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `chore`, `build`, `ci`. Scopes: `sim`, `agents`, `economy`, `network`, `city`, `build`, `web`, `render`, `ui`, `talk`, `tools`, `repo`. Examples: `feat(agents): let residents visit friends`, `fix(economy): count lateness once per shift`, `perf(sim): batch dormant agent updates`. Put details, behaviour changes and test threshold changes in the body.
- One milestone or coherent change per branch (`m11-scaling`, `fix-…`); don't push directly to `main` without being asked.
- Never commit secrets, `.env` files, `node_modules`, `dist` or generated reports.

## HappyScribe

Base URL: `https://www.happyscribe.com/api/v1`. Auth header: `Authorization: Bearer`. The key stays in server code only.

Use the current orders API:

- `GET /uploads/new?filename=` returns `{ signedUrl }`. The browser PUTs the file to that URL. The same URL is the order `url`. Do not add an S3 bucket.
- `GET /organizations` supplies `organization_id` unless `HAPPYSCRIBE_ORGANIZATION_ID` is set.
- `POST /orders` with `service: "auto"` and `confirm: true` creates a transcription. Do not call deprecated `POST /transcriptions`.
- `POST /orders/translation` with `target_languages: ["es"]` creates a translation. Do not call deprecated `POST /task/transcription_translation`.
- Poll `GET /orders/:id`. Finished work is `fulfilled`. `outputsIds[0]` is the transcript id. Do not use the numeric `transcriptions[].id`.
- Transcript text is not on the order. `POST /exports` with `format: "txt"`, then poll `GET /exports/:id` until `ready`, then download `download_link` on the server.
- File orders require a BCP-47 source language. `auto` is documented for meetings, not this flow.
- Source codes are regional (`en-US`). Translation codes are the short codes from the translation docs (`es`, `pt-BR`, `pt-PT`).

Do not log the API key or signed URLs. Do not pass raw upstream bodies to the browser.

## Voicebox

Default URL: `http://127.0.0.1:17493` via `VOICEBOX_API_URL`.

- `GET /health` and `GET /profiles`
- `POST /generate` with `profile_id`, then read `GET /generate/:id/status` until `completed`
- Proxy `GET /audio/:id`. Do not send `audio_path` to the browser.
- There is no anonymous voice. Hide profiles with `voice_type: "import"`.
- Send a profile `engine` when Voicebox provides one. Preset voices such as Alloy use `kokoro`.
- Transcription and translation still finish when the local Voicebox server is unavailable. Speech does not.

## Checks

`pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` must pass. `pnpm test` must not call HappyScribe. `pnpm test:integration` is opt-in and must not create an order.
