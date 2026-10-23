# MediaLingo

MediaLingo turns audio and video into a transcript, a translation, and spoken audio.

Upload a file, choose the source language and the language you want, and MediaLingo writes the transcript, translates it, and speaks the translation. Transcription and translation use [HappyScribe](https://www.happyscribe.com). Speech uses a local [Voicebox](https://github.com/jamiepine/voicebox) server.

![MediaLingo home page](docs/home.png)

## Requirements

- Node.js 20 or newer
- pnpm 10 or newer
- A HappyScribe API key
- Voicebox on Apple Silicon, from the official macOS build

## Setup

```bash
pnpm install
cp .env.example .env.local
```

Add the HappyScribe key to `.env.local`:

```text
HAPPYSCRIBE_API_KEY=your_key
```

`HAPPYSCRIBE_ORGANIZATION_ID` selects a workspace. When it is empty, MediaLingo uses the first workspace on the key.

Install Voicebox and leave it open:

1. Download the Apple Silicon build from https://voicebox.sh/download/mac-arm.
2. Open Voicebox and create a voice profile.
3. Keep Voicebox running. It serves speech at `http://127.0.0.1:17493`.
4. Set `VOICEBOX_API_URL` only if Voicebox uses a different address.

```bash
pnpm dev
```

Open http://127.0.0.1:3000.

## Use MediaLingo

1. Add an MP3, WAV, M4A, MP4, MOV, or WebM file up to 100 MB.
2. Choose the source language and the translation language.
3. Click **Process**.
4. Read the original transcript and the translation. Copy either one, or download it as `.txt`.
5. Choose a voice and click **Generate Voice**.

Source languages are regional codes such as `en-US`. Translation languages are the short codes HappyScribe expects, such as `es`, `pt-BR`, and `pt-PT`. The source and target need to be different languages. Portuguese (Brazil) can still be translated into Portuguese (Portugal).

HappyScribe machine transcription and translation use credits on the connected account. Voicebox speaks through the voice profiles on this computer. Preset voices such as Alloy are ready to use. MediaLingo does not clone voices.

## Development

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

`pnpm test` does not call HappyScribe. `pnpm test:e2e` runs the product flow with the API routes mocked.

```bash
pnpm test:integration
```

`pnpm test:integration` is opt-in. Without `HAPPYSCRIBE_API_KEY` it skips. With a key, it lists workspaces and requests one signed upload URL. It does not create an order.
