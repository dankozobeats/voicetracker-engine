import { z } from 'zod';

const monthRegex = /^\d{4}-\d{2}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const aiPlanRequestSchema = z.object({
  message: z.string().min(1, 'message is required'),
  contextWindowMonths: z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12)]).optional(),
});

const transactionPayloadSchema = z
  .object({
    date: z.string().regex(dateRegex, 'date must be YYYY-MM-DD'),
    label: z.string().min(1),
    amount: z.number(),
    category: z.string().min(1),
    account: z.enum(['SG', 'FLOA']).optional(),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    is_deferred: z.boolean().optional(),
    deferred_to: z.string().regex(monthRegex, 'deferred_to must be YYYY-MM').optional(),
    deferred_until: z.string().regex(monthRegex, 'deferred_until must be YYYY-MM').optional(),
    max_deferral_months: z.number().int().positive().optional(),
    priority: z.number().int().min(1).max(9).optional(),
    budget_id: z.string().min(1).optional(),
  })
  .strict();

const budgetPayloadSchema = z
  .object({
    category: z.string().min(1),
    amount: z.number().positive(),
    period: z.enum(['MONTHLY', 'ROLLING', 'MULTI']),
    startDate: z.string().regex(dateRegex, 'startDate must be YYYY-MM-DD').optional(),
    endDate: z.string().regex(dateRegex, 'endDate must be YYYY-MM-DD').optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.period === 'MULTI') {
      if (!value.startDate || !value.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'startDate and endDate are required for MULTI period',
          path: ['startDate'],
        });
      }
    }
  });

const projectionPayloadSchema = z
  .object({
    account: z.enum(['SG', 'FLOA']).optional(),
    month: z.string().regex(monthRegex, 'month must be YYYY-MM'),
    months: z.number().int().min(1).max(24),
  })
  .strict();

export const aiPlanStepSchema = z.object({
  step: z.number().int().min(1).max(5),
  action: z.enum(['CREATE_TRANSACTION', 'CREATE_BUDGET', 'RUN_PROJECTION']),
  payload: z.record(z.unknown()),
  requiresConfirmation: z.literal(true),
  actionId: z.string().uuid().optional(),
});

export const aiPlanResponseSchema = z.object({
  steps: z.array(aiPlanStepSchema),
});

export type AiPlanRequest = z.infer<typeof aiPlanRequestSchema>;
export type AiPlanResponse = z.infer<typeof aiPlanResponseSchema>;
