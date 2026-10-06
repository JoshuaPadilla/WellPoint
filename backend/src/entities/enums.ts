export enum WaterSourceType {
  RIVER = 'river',
  SPRING = 'spring',
  GROUNDWATER = 'groundwater',
  RESERVOIR = 'reservoir',
}

export enum WaterSourceStatus {
  OK = 'ok',
  LOW = 'low',
  CONTAMINATED = 'contaminated',
  OFFLINE = 'offline',
}

export enum ServiceLevel {
  I = 'I',
  II = 'II',
  III = 'III',
}

export enum WaterQuality {
  SAFE = 'safe',
  ADVISORY = 'advisory',
  UNSAFE = 'unsafe',
}

export enum DisruptionReason {
  DROUGHT = 'drought',
  TYPHOON = 'typhoon',
  MAINTENANCE = 'maintenance',
  CONTAMINATION = 'contamination',
}

export enum ReportType {
  NO_WATER = 'no_water',
  LOW_PRESSURE = 'low_pressure',
  CONTAMINATION = 'contamination',
  INFRASTRUCTURE_DAMAGE = 'infrastructure_damage',
  OTHER = 'other',
}

export enum ReportStatus {
  NEW = 'new',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
}

export type AlertType = 'shortage' | 'contamination' | 'outage';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'resolved';

export type AccessState = 'served' | 'partial' | 'underserved';
export type VulnerabilityTier = 'low' | 'medium' | 'high';
export type StatusBand = 'secure' | 'watch' | 'critical';
export type DisruptionType =
  'drought' | 'typhoon' | 'maintenance' | 'contamination';
