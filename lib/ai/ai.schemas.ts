import { z } from 'zod';

export const aiContextWindowSchema = z.union([
  z.literal(1),
  z.literal(3),
  z.literal(6),
  z.literal(12),
]);

export const aiChatRequestSchema = z.object({
  message: z.string().min(1, 'message is required'),
  contextWindowMonths: aiContextWindowSchema.optional(),
});

const aiInsightSchema = z.object({
  title: z.string(),
  detail: z.string(),
  evidence: z.array(z.string()).optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
});

const aiProposedActionSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  requiresConfirmation: z.boolean(),
  payload: z.record(z.unknown()).optional(),
});

const aiMetaSchema = z.object({
  contextWindowMonths: aiContextWindowSchema,
  toolsUsed: z.array(z.string()),
  errors: z.array(z.string()).optional(),
  limits: z.array(z.string()).optional(),
});

export const aiChatResponseSchema = z.object({
  reply: z.string(),
  insights: z.array(aiInsightSchema).optional(),
  proposedActions: z.array(aiProposedActionSchema).optional(),
  meta: aiMetaSchema.optional(),
});
