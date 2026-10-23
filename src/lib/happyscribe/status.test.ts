import { describe, expect, it } from "vitest";

import {
  parseExport,
  parseOrder,
  parseOrganizations,
  parseSignedUpload,
} from "@/lib/happyscribe/schemas";
import {
  mapOrderStatus,
  missingTranscriptMessage,
  orderFailureMessage,
  organizationIdValue,
  transcriptionIdFromOrder,
} from "@/lib/happyscribe/status";

const fulfilledOrder = {
  id: "10b1edd9381d4a00a3d0db1ca1b3d0cf",
  state: "fulfilled",
  outputsIds: ["e5fb537cecc9436b93c04be2a9219001"],
  transcriptions: [
    {
      id: 123,
      uuid: "20481bf70b514a2f866f6977db97ac84",
      state: "automatic_done",
    },
  ],
  ingestions: [{ state: "done" }],
  extra_field: true,
};

describe("HappyScribe schemas", () => {
  it("parses a signed upload from either field name", () => {
    expect(
      parseSignedUpload({
        signedUrl: "https://example.com/file",
        region: "eu",
      }),
    ).toEqual({
      signedUrl: "https://example.com/file",
      region: "eu",
    });
    expect(
      parseSignedUpload({
        signed_url: "https://example.com/file",
      })?.signedUrl,
    ).toBe("https://example.com/file");
    expect(parseSignedUpload({ url: "https://example.com/file" })).toBeNull();
  });

  it("parses organizations and coerces ids to strings", () => {
    expect(
      parseOrganizations({ organizations: [{ id: 123, name: "Personal" }] }),
    ).toEqual({
      organizations: [{ id: "123", name: "Personal" }],
    });
  });

  it("parses orders from the top level or an order wrapper", () => {
    expect(parseOrder(fulfilledOrder)?.id).toBe(
      "10b1edd9381d4a00a3d0db1ca1b3d0cf",
    );
    expect(parseOrder({ order: fulfilledOrder })?.state).toBe("fulfilled");
    expect(parseOrder({ nope: true })).toBeNull();
  });

  it("parses exports", () => {
    expect(
      parseExport({
        id: "export-1",
        state: "ready",
        download_link: "https://example.com/transcript.txt",
      })?.state,
    ).toBe("ready");
  });
});

describe("order status", () => {
  it("maps HappyScribe states onto pending, fulfilled, and failed", () => {
    expect(mapOrderStatus("submitted")).toBe("pending");
    expect(mapOrderStatus("free_trial_submitted")).toBe("pending");
    expect(mapOrderStatus("fulfilled")).toBe("fulfilled");
    expect(mapOrderStatus("free_trial_fulfilled")).toBe("fulfilled");
    expect(mapOrderStatus("failed")).toBe("failed");
    expect(mapOrderStatus("locked")).toBe("failed");
    expect(mapOrderStatus("canceled")).toBe("failed");
    expect(mapOrderStatus("expired")).toBe("failed");
  });

  it("prefers the output id over the numeric transcription id", () => {
    const order = parseOrder(fulfilledOrder);
    expect(order).not.toBeNull();
    expect(transcriptionIdFromOrder(order!)).toBe(
      "e5fb537cecc9436b93c04be2a9219001",
    );
  });

  it("reads the snake_case output id used by the live API", () => {
    const order = parseOrder({
      id: "abc",
      state: "fulfilled",
      outputs_ids: ["19ee0bf23987421f9756393d89237027"],
      transcriptions: [],
    });
    expect(transcriptionIdFromOrder(order!)).toBe(
      "19ee0bf23987421f9756393d89237027",
    );
  });

  it("explains a fulfilled translation into the same language", () => {
    const order = parseOrder({
      id: "abc",
      state: "fulfilled",
      outputs_ids: [],
      transcriptions: [],
      operations: [{ language: "en-US", target_language: "en" }],
    });
    expect(missingTranscriptMessage(order!)).toContain("matches the source");
  });

  it("falls back to the transcription uuid", () => {
    const order = parseOrder({
      id: "abc",
      state: "fulfilled",
      transcriptions: [{ id: 4, uuid: "uuid-4" }],
    });
    expect(transcriptionIdFromOrder(order!)).toBe("uuid-4");
  });

  it("uses the ingestion message when HappyScribe provides one", () => {
    const order = parseOrder({
      id: "abc",
      state: "failed",
      failure_reason: "ingestion_failed",
      ingestions: [
        {
          state: "failed",
          failure_message:
            "Unable to access the file. The URL may have expired.",
        },
      ],
    });
    expect(orderFailureMessage(order!)).toBe(
      "Unable to access the file. The URL may have expired.",
    );
  });

  it("explains a locked order without exposing raw payloads", () => {
    const order = parseOrder({ id: "abc", state: "locked" });
    expect(orderFailureMessage(order!)).toContain("enough credits");
  });

  it("sends numeric organization ids as numbers", () => {
    expect(organizationIdValue("123")).toBe(123);
    expect(organizationIdValue("org_abc")).toBe("org_abc");
  });
});
