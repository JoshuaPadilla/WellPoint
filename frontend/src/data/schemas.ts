import { z } from 'zod'

export const waterSourceTypeEnum = z.enum([
  'river',
  'spring',
  'groundwater',
  'reservoir',
])
export const waterSourceStatusEnum = z.enum([
  'ok',
  'low',
  'contaminated',
  'offline',
])
export const serviceLevelEnum = z.enum(['I', 'II', 'III'])
export const waterQualityEnum = z.enum(['safe', 'advisory', 'unsafe'])
export const disruptionReasonEnum = z.enum([
  'drought',
  'typhoon',
  'maintenance',
  'contamination',
])
export const reportTypeEnum = z.enum([
  'no_water',
  'low_pressure',
  'contamination',
  'infrastructure_damage',
  'other',
])
export const reportStatusEnum = z.enum(['new', 'acknowledged', 'resolved'])
export const alertTypeEnum = z.enum(['shortage', 'contamination', 'outage'])
export const alertSeverityEnum = z.enum(['info', 'warning', 'critical'])
export const alertStatusEnum = z.enum(['active', 'resolved'])
export const accessStateEnum = z.enum(['served', 'partial', 'underserved'])
export const vulnerabilityTierEnum = z.enum(['low', 'medium', 'high'])
export const statusBandEnum = z.enum(['secure', 'watch', 'critical'])

export const waterSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: waterSourceTypeEnum,
  lat: z.number(),
  lng: z.number(),
  barangayId: z.string().nullable(),
  barangayName: z.string().nullable(),
  capacity: z.number(),
  status: waterSourceStatusEnum,
})

export const waterSystemSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: serviceLevelEnum,
  coverageArea: z.string(),
  serviceHours: z.number(),
  operator: z.string(),
  sourceIds: z.array(z.string()),
})

export const serviceStatusSchema = z.object({
  systemId: z.string(),
  timestamp: z.string(),
  available: z.boolean(),
  flow: z.number(),
  quality: waterQualityEnum,
  reason: disruptionReasonEnum.nullable(),
})

export const statusItemSchema = z.object({
  systemId: z.string(),
  systemName: z.string(),
  area: z.string(),
  level: serviceLevelEnum,
  timestamp: z.string(),
  available: z.boolean(),
  flow: z.number(),
  quality: waterQualityEnum,
  reason: disruptionReasonEnum.nullable(),
})

export const alertSchema = z.object({
  id: z.string(),
  type: alertTypeEnum,
  severity: alertSeverityEnum,
  area: z.string(),
  psgcCode: z.string().nullable(),
  systemId: z.string().nullable(),
  reportId: z.string().nullable(),
  raisedAt: z.string(),
  status: alertStatusEnum,
  reason: z.string().nullable(),
  message: z.string(),
  action: z.string(),
})

export const communityReportSchema = z.object({
  id: z.string(),
  reporter: z.string(),
  area: z.string(),
  psgcCode: z.string().nullable(),
  type: reportTypeEnum,
  description: z.string(),
  status: reportStatusEnum,
  createdAt: z.string(),
})

export const communitySchema = z.object({
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
  serviceLevel: serviceLevelEnum.nullable(),
  accessState: accessStateEnum,
  vulnerabilityTier: vulnerabilityTierEnum,
})

export const metricsSchema = z.object({
  accessCoverage: z.number(),
  reliability: z.number(),
  affordability: z.number(),
  activeAlerts: z.number(),
  score: z.number(),
  band: statusBandEnum,
})

export const vulnerabilityBreakdownSchema = z.object({
  tier: vulnerabilityTierEnum,
  isolation: z.number(),
  levelRisk: z.number(),
  capacityRisk: z.number(),
  score: z.number(),
})

export const barangayDetailSchema = z.object({
  community: communitySchema,
  system: waterSystemSchema.nullable(),
  sources: z.array(waterSourceSchema),
  statusHistory: z.array(serviceStatusSchema),
  alerts: z.array(alertSchema),
  openReports: z.array(communityReportSchema),
  vulnerability: vulnerabilityBreakdownSchema,
})

export const publicStatusSchema = z.object({
  barangay: z.string(),
  available: z.boolean(),
  quality: waterQualityEnum,
  affordable: z.boolean(),
  summary: z.string(),
  alerts: z.array(
    z.object({
      type: alertTypeEnum,
      severity: alertSeverityEnum,
      message: z.string(),
      action: z.string(),
    }),
  ),
  contacts: z.array(z.object({ name: z.string(), contact: z.string() })),
})

export const publicBarangaySchema = z.object({
  id: z.string(),
  name: z.string(),
  psgcCode: z.string(),
})

export const userRoleEnum = z.enum([
  'water-officer',
  'drrm-officer',
  'barangay-official',
  'resident',
  'barangay-admin',
])

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: userRoleEnum,
  lguId: z.string(),
  barangayId: z.string().nullable(),
  permissions: z.array(z.string()),
})

export type WaterSource = z.infer<typeof waterSourceSchema>
export type WaterSystem = z.infer<typeof waterSystemSchema>
export type ServiceStatus = z.infer<typeof serviceStatusSchema>
export type StatusItem = z.infer<typeof statusItemSchema>
export type Alert = z.infer<typeof alertSchema>
export type CommunityReport = z.infer<typeof communityReportSchema>
export type Community = z.infer<typeof communitySchema>
export type Metrics = z.infer<typeof metricsSchema>
export type BarangayDetail = z.infer<typeof barangayDetailSchema>
export type PublicStatus = z.infer<typeof publicStatusSchema>
export type PublicBarangay = z.infer<typeof publicBarangaySchema>
export type AuthUser = z.infer<typeof authUserSchema>
export type UserRole = z.infer<typeof userRoleEnum>
export type AccessState = z.infer<typeof accessStateEnum>
export type VulnerabilityTier = z.infer<typeof vulnerabilityTierEnum>
export type StatusBand = z.infer<typeof statusBandEnum>
export type AlertSeverity = z.infer<typeof alertSeverityEnum>
export type DisruptionReason = z.infer<typeof disruptionReasonEnum>
