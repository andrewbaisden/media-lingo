import { z } from "zod";

const idSchema = z.union([z.string(), z.number()]).transform(String);

export const signedUploadSchema = z.looseObject({
  signedUrl: z.string().min(1).optional(),
  signed_url: z.string().min(1).optional(),
});

export const organizationsSchema = z.looseObject({
  organizations: z.array(
    z.looseObject({
      id: idSchema,
      name: z.string().optional(),
    }),
  ),
});

export const orderSchema = z.looseObject({
  id: idSchema,
  state: z.string(),
  failure_reason: z.string().nullish(),
  outputsIds: z.array(idSchema).nullish(),
  outputs_ids: z.array(idSchema).nullish(),
  operations: z
    .array(
      z.looseObject({
        language: z.string().nullish(),
        target_language: z.string().nullish(),
      }),
    )
    .nullish(),
  transcriptions: z
    .array(
      z.looseObject({
        id: idSchema.optional(),
        uuid: z.string().nullish(),
        state: z.string().nullish(),
      }),
    )
    .nullish(),
  ingestions: z
    .array(
      z.looseObject({
        state: z.string().nullish(),
        failure_reason: z.string().nullish(),
        failure_message: z.string().nullish(),
      }),
    )
    .nullish(),
});

export const exportSchema = z.looseObject({
  id: idSchema,
  state: z.string(),
  download_link: z.string().nullish(),
});

export const uploadUrlRequestSchema = z.object({
  filename: z.string().trim().min(1).max(200),
});

export const createOrderRequestSchema = z.object({
  url: z.string().min(1),
  language: z.string().min(2).max(32),
  name: z.string().trim().min(1).max(120).optional(),
});

export const createTranslationRequestSchema = z.object({
  transcriptionId: z.string().trim().min(1).max(80),
  targetLanguage: z.string().trim().min(2).max(16),
  sourceLanguage: z.string().trim().min(2).max(32).optional(),
});

export const exportRequestSchema = z.object({
  transcriptionId: z.string().trim().min(1).max(80),
});

export type SignedUpload = z.infer<typeof signedUploadSchema>;
export type OrganizationList = z.infer<typeof organizationsSchema>;
export type HappyScribeOrder = z.infer<typeof orderSchema>;
export type HappyScribeExport = z.infer<typeof exportSchema>;

export function parseSignedUpload(data: unknown): SignedUpload | null {
  const parsed = signedUploadSchema.safeParse(data);
  if (!parsed.success) {
    return null;
  }
  const signedUrl = parsed.data.signedUrl || parsed.data.signed_url;
  if (!signedUrl) {
    return null;
  }
  return { ...parsed.data, signedUrl };
}

export function parseOrganizations(data: unknown): OrganizationList | null {
  const parsed = organizationsSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

export function parseOrder(data: unknown): HappyScribeOrder | null {
  const direct = orderSchema.safeParse(data);
  if (direct.success) {
    return direct.data;
  }
  const wrapped = z.looseObject({ order: orderSchema }).safeParse(data);
  return wrapped.success ? wrapped.data.order : null;
}

export function parseExport(data: unknown): HappyScribeExport | null {
  const direct = exportSchema.safeParse(data);
  if (direct.success) {
    return direct.data;
  }
  const wrapped = z.looseObject({ export: exportSchema }).safeParse(data);
  return wrapped.success ? wrapped.data.export : null;
}
