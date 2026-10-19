import { z } from "zod";

const RESERVED_SLUGS = ["links", "api"];

function isHttpUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export const createLinkSchema = z.object({
  url: z.string().trim().refine(isHttpUrl, "Informe uma URL válida"),
  customSlug: z
    .string()
    .trim()
    .min(3, "O slug precisa de pelo menos 3 caracteres")
    .max(32, "O slug pode ter no máximo 32 caracteres")
    .regex(/^[a-zA-Z0-9_-]+$/, "Use apenas letras, números, - e _")
    .refine((slug) => !RESERVED_SLUGS.includes(slug.toLowerCase()), "Esse slug é reservado")
    .optional(),
});

export const listLinksQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const statsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
