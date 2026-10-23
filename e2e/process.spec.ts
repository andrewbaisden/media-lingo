import { expect, test } from "@playwright/test";

test("processes a file into both transcripts", async ({ page }) => {
  await page.route("**/api/happyscribe/upload-url", async (route) => {
    await route.fulfill({
      json: { signedUrl: "https://example.com/upload" },
    });
  });

  await page.route("https://example.com/**", async (route) => {
    await route.fulfill({ status: 200, body: "" });
  });

  await page.route("**/api/happyscribe/orders", async (route) => {
    await route.fulfill({ json: { id: "order-1", state: "submitted" } });
  });

  await page.route("**/api/happyscribe/translations", async (route) => {
    await route.fulfill({ json: { id: "order-2", state: "submitted" } });
  });

  await page.route("**/api/happyscribe/orders/order-1", async (route) => {
    await route.fulfill({
      json: {
        id: "order-1",
        state: "fulfilled",
        status: "fulfilled",
        transcriptionId: "tx-original",
      },
    });
  });

  await page.route("**/api/happyscribe/orders/order-2", async (route) => {
    await route.fulfill({
      json: {
        id: "order-2",
        state: "fulfilled",
        status: "fulfilled",
        transcriptionId: "tx-translated",
      },
    });
  });

  await page.route("**/api/happyscribe/exports", async (route) => {
    const body = route.request().postDataJSON() as { transcriptionId: string };
    const text =
      body.transcriptionId === "tx-translated"
        ? "Hola y bienvenidos"
        : "Hello and welcome";
    await route.fulfill({ json: { text } });
  });

  await page.route("**/api/voicebox/status", async (route) => {
    await route.fulfill({
      json: {
        available: false,
        profiles: [],
        message:
          "Voicebox is not currently running. Start the local Voicebox service and try again.",
      },
    });
  });

  await page.goto("/");
  await page.waitForFunction(
    () => sessionStorage.getItem("medialingo-ready") === "1",
  );
  await page.locator("#media-file").setInputFiles({
    name: "sample.mp3",
    mimeType: "audio/mpeg",
    buffer: Buffer.from("not-real-audio"),
  });
  await page.getByRole("button", { name: "Process" }).click();

  await expect(page.getByTestId("original-transcript")).toContainText(
    "Hello and welcome",
  );
  await expect(page.getByTestId("translated-transcript")).toContainText(
    "Hola y bienvenidos",
  );
  await expect(page.getByText("Upload complete")).toBeVisible();
  await expect(page.getByText("Translation complete").first()).toBeVisible();
  await expect(
    page.getByText("Voicebox is not currently running."),
  ).toBeVisible();
});
