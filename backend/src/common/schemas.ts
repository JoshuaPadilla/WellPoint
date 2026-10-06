import { z } from 'zod';

export const reportTypeSchema = z.enum([
  'no_water',
  'low_pressure',
  'contamination',
  'infrastructure_damage',
  'other',
]);

export const createReportSchema = z.object({
  area: z.string().min(1).max(80),
  type: reportTypeSchema,
  description: z.string().min(1).max(500),
});

export const reportStatusSchema = z.enum(['acknowledged', 'resolved']);

export const patchReportStatusSchema = z.object({
  status: reportStatusSchema,
});

export const disruptionTypeSchema = z.enum([
  'typhoon',
  'drought',
  'contamination',
  'maintenance',
]);

export const simulateSchema = z.object({
  type: disruptionTypeSchema,
  targetSystemId: z.string().min(1),
});

export type CreateReportDto = z.infer<typeof createReportSchema>;
export type SimulateDto = z.infer<typeof simulateSchema>;
export type PatchReportStatusDto = z.infer<typeof patchReportStatusSchema>;
