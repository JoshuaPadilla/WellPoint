import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const WaterSourceTypeEnum = z.enum([
  'river',
  'spring',
  'groundwater',
  'reservoir',
]);
export const WaterSourceStatusEnum = z.enum([
  'ok',
  'low',
  'contaminated',
  'offline',
]);
export const ServiceLevelEnum = z.enum(['I', 'II', 'III']);
export const WaterQualityEnum = z.enum(['safe', 'advisory', 'unsafe']);
export const DisruptionReasonEnum = z.enum([
  'drought',
  'typhoon',
  'maintenance',
  'contamination',
]);
export const ReportTypeEnum = z.enum([
  'no_water',
  'low_pressure',
  'contamination',
  'infrastructure_damage',
  'other',
]);
export const ReportStatusEnum = z.enum(['new', 'acknowledged', 'resolved']);
export const AlertTypeEnum = z.enum(['shortage', 'contamination', 'outage']);
export const AlertSeverityEnum = z.enum(['info', 'warning', 'critical']);
export const AlertStatusEnum = z.enum(['active', 'resolved']);
export const AccessStateEnum = z.enum(['served', 'partial', 'underserved']);
export const VulnerabilityTierEnum = z.enum(['low', 'medium', 'high']);
export const StatusBandEnum = z.enum(['secure', 'watch', 'critical']);

export const WaterSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: WaterSourceTypeEnum,
  lat: z.number(),
  lng: z.number(),
  barangayId: z.string().nullable(),
  barangayName: z.string().nullable(),
  capacity: z.number(),
  status: WaterSourceStatusEnum,
});

export const WaterSystemSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: ServiceLevelEnum,
  coverageArea: z.string(),
  serviceHours: z.number(),
  operator: z.string(),
  sourceIds: z.array(z.string()),
});

export const ServiceStatusSchema = z.object({
  systemId: z.string(),
  timestamp: z.string(),
  available: z.boolean(),
  flow: z.number(),
  quality: WaterQualityEnum,
  reason: DisruptionReasonEnum.nullable(),
});

export const StatusItemSchema = z.object({
  systemId: z.string(),
  systemName: z.string(),
  area: z.string(),
  level: ServiceLevelEnum,
  timestamp: z.string(),
  available: z.boolean(),
  flow: z.number(),
  quality: WaterQualityEnum,
  reason: DisruptionReasonEnum.nullable(),
});

export const AlertSchema = z.object({
  id: z.string(),
  type: AlertTypeEnum,
  severity: AlertSeverityEnum,
  area: z.string(),
  psgcCode: z.string().nullable(),
  systemId: z.string().nullable(),
  reportId: z.string().nullable(),
  raisedAt: z.string(),
  status: AlertStatusEnum,
  reason: z.string().nullable(),
  message: z.string(),
  action: z.string(),
});

export const CommunityReportSchema = z.object({
  id: z.string(),
  reporter: z.string(),
  area: z.string(),
  psgcCode: z.string().nullable(),
  type: ReportTypeEnum,
  description: z.string(),
  status: ReportStatusEnum,
  createdAt: z.string(),
});

export const CommunitySchema = z.object({
  id: z.string(),
  name: z.string(),
  psgcCode: z.string(),
  areaSqKm: z.number(),
  distanceToCenterKm: z.number(),
  population: z.number(),
  affordability: z.number(),
  lat: z.number(),
  lng: z.number(),
  boundary: z.object({ type: z.string(), coordinates: z.unknown() }).nullable(),
  systemId: z.string().nullable(),
  serviceLevel: ServiceLevelEnum.nullable(),
  accessState: AccessStateEnum,
  vulnerabilityTier: VulnerabilityTierEnum,
});

export const VulnerabilityBreakdownSchema = z.object({
  tier: VulnerabilityTierEnum,
  isolation: z.number(),
  levelRisk: z.number(),
  capacityRisk: z.number(),
  score: z.number(),
});

export const MetricsSchema = z.object({
  accessCoverage: z.number(),
  reliability: z.number(),
  affordability: z.number(),
  activeAlerts: z.number(),
  score: z.number(),
  band: StatusBandEnum,
});

export const BarangayDetailSchema = z.object({
  community: CommunitySchema,
  system: WaterSystemSchema.nullable(),
  sources: z.array(WaterSourceSchema),
  statusHistory: z.array(ServiceStatusSchema),
  alerts: z.array(AlertSchema),
  openReports: z.array(CommunityReportSchema),
  vulnerability: VulnerabilityBreakdownSchema,
});

export const PublicAlertSchema = z.object({
  type: AlertTypeEnum,
  severity: AlertSeverityEnum,
  message: z.string(),
  action: z.string(),
});

export const PublicStatusSchema = z.object({
  barangay: z.string(),
  available: z.boolean(),
  quality: WaterQualityEnum,
  affordable: z.boolean(),
  summary: z.string(),
  alerts: z.array(PublicAlertSchema),
  contacts: z.array(z.object({ name: z.string(), contact: z.string() })),
});

export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.enum([
    'water-officer',
    'drrm-officer',
    'barangay-official',
    'resident',
    'barangay-admin',
  ]),
  lguId: z.string(),
  barangayId: z.string().nullable(),
  permissions: z.array(z.string()),
});

// Request DTOs

export const CreateReportSchema = z.object({
  type: ReportTypeEnum,
  description: z.string().trim().min(1).max(500),
});

export class CreateReportDto extends createZodDto(CreateReportSchema) {}

export const SimulateSchema = z.object({
  type: DisruptionReasonEnum,
  targetSystemId: z.string().optional(),
});

export class SimulateDto extends createZodDto(SimulateSchema) {}

export const DevLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export class DevLoginDto extends createZodDto(DevLoginSchema) {}

export type WaterSourceDto = z.infer<typeof WaterSourceSchema>;
export type WaterSystemDto = z.infer<typeof WaterSystemSchema>;
export type ServiceStatusDto = z.infer<typeof ServiceStatusSchema>;
export type StatusItemDto = z.infer<typeof StatusItemSchema>;
export type AlertDto = z.infer<typeof AlertSchema>;
export type CommunityReportDto = z.infer<typeof CommunityReportSchema>;
export type CommunityDto = z.infer<typeof CommunitySchema>;
export type MetricsDto = z.infer<typeof MetricsSchema>;
export type BarangayDetailDto = z.infer<typeof BarangayDetailSchema>;
export type PublicStatusDto = z.infer<typeof PublicStatusSchema>;
export type AuthUserDto = z.infer<typeof AuthUserSchema>;
