import "server-only";

import { HappyScribeError } from "@/lib/errors";
import { happyscribeRequest } from "@/lib/happyscribe/client";
import { parseOrganizations } from "@/lib/happyscribe/schemas";

let cachedOrganizationId: string | null = null;

export async function resolveOrganizationId(): Promise<string> {
  const override = process.env.HAPPYSCRIBE_ORGANIZATION_ID?.trim();
  if (override) {
    return override;
  }

  if (cachedOrganizationId) {
    return cachedOrganizationId;
  }

  const payload = await happyscribeRequest("/organizations");
  const parsed = parseOrganizations(payload);
  const organization = parsed?.organizations[0];
  if (!organization) {
    throw new HappyScribeError(
      "No HappyScribe workspace was found for this API key.",
      422,
      "validation",
    );
  }

  cachedOrganizationId = organization.id;
  return organization.id;
}
