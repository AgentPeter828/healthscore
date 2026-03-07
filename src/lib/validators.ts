import { z } from "zod";

// Helper: check max depth of a JSON object
function checkDepth(obj: unknown, maxDepth: number, currentDepth = 0): boolean {
  if (currentDepth > maxDepth) return false;
  if (obj === null || typeof obj !== "object") return true;
  if (Array.isArray(obj)) {
    return obj.every((item) => checkDepth(item, maxDepth, currentDepth + 1));
  }
  return Object.values(obj).every((val) => checkDepth(val, maxDepth, currentDepth + 1));
}

// Webhook payload: must be an object, max depth 5
export const webhookPayloadSchema = z
  .record(z.unknown())
  .refine((val) => checkDepth(val, 5), {
    message: "Webhook payload exceeds maximum nesting depth of 5",
  });

// Formula update: weights array, each 0-100, must sum to 100
export const formulaComponentSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  weight: z.number().min(0).max(100),
  enabled: z.boolean(),
  description: z.string().optional(),
});

export const formulaUpdateSchema = z.object({
  components: z.array(formulaComponentSchema).min(1),
  thresholds: z
    .object({
      green: z.number().min(0).max(100),
      yellow: z.number().min(0).max(100),
    })
    .optional(),
  name: z.string().max(200).optional(),
});

// Note creation
export const noteCreationSchema = z.object({
  account_id: z.string().uuid(),
  content: z.string().min(1).max(10000),
  type: z.enum(["note", "call", "meeting", "email"]).default("note"),
});

// Account creation
export const accountCreationSchema = z.object({
  name: z.string().min(1).max(500),
  domain: z
    .string()
    .url("Domain must be a valid URL")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
  mrr: z.number().min(0).optional(),
  seats: z.number().int().min(0).optional(),
  status: z.enum(["active", "churned", "trial", "paused"]).optional(),
  segment: z.enum(["green", "yellow", "red"]).optional(),
  plan: z.string().max(200).optional(),
  external_id: z.string().max(500).optional(),
  renewal_date: z.string().optional(),
  csm_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  custom_fields: z.record(z.unknown()).optional(),
});

// Validate formula weights: all >= 0, enabled sum to 100
export function validateFormulaWeights(
  components: z.infer<typeof formulaComponentSchema>[]
): { valid: boolean; error?: string } {
  for (const c of components) {
    if (c.weight < 0) {
      return { valid: false, error: `Weight for "${c.label}" must be >= 0` };
    }
  }

  const enabled = components.filter((c) => c.enabled);
  if (enabled.length === 0) {
    return { valid: false, error: "At least one component must be enabled" };
  }

  const total = enabled.reduce((sum, c) => sum + c.weight, 0);
  if (Math.abs(total - 100) > 1) {
    return {
      valid: false,
      error: `Enabled component weights must sum to 100 (current: ${total})`,
    };
  }

  return { valid: true };
}
