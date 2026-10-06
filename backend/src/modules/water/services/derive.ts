import type {
  AccessState,
  StatusBand,
  VulnerabilityTier,
} from '../../../entities/enums';

export interface StatusSnapshot {
  available: boolean;
  flow: number;
  quality: string;
  reason: string | null;
}

export function deriveAccessState(
  status: StatusSnapshot | null,
  affordability: number,
): AccessState {
  if (!status) {
    return 'underserved';
  }
  const { available, flow, quality } = status;
  if (!available || quality === 'unsafe') {
    return 'underserved';
  }
  if (flow >= 60 && quality === 'safe' && affordability >= 50) {
    return 'served';
  }
  if (flow >= 25 && quality !== 'unsafe' && affordability >= 30) {
    return 'partial';
  }
  return 'underserved';
}

export function deriveIsolation(
  areaSqKm: number,
  distanceToCenterKm: number,
): number {
  return (
    0.5 * Math.min(1, areaSqKm / 10) +
    0.5 * Math.min(1, distanceToCenterKm / 15)
  );
}

export interface VulnerabilityInputs {
  areaSqKm: number;
  distanceToCenterKm: number;
  level: string;
  capacityMargin: number;
}

export interface VulnerabilityResult {
  tier: VulnerabilityTier;
  isolation: number;
  levelRisk: number;
  capacityRisk: number;
  score: number;
}

export function deriveVulnerability(
  inputs: VulnerabilityInputs,
): VulnerabilityResult {
  const isolation = deriveIsolation(inputs.areaSqKm, inputs.distanceToCenterKm);
  const levelRisk = inputs.level === 'I' ? 1 : inputs.level === 'II' ? 0.5 : 0;
  const capacityRisk = 1 - Math.min(1, inputs.capacityMargin);
  const score = 0.5 * isolation + 0.3 * levelRisk + 0.2 * capacityRisk;
  const tier: VulnerabilityTier =
    score >= 0.6 ? 'high' : score >= 0.35 ? 'medium' : 'low';
  return {
    tier,
    isolation: Number(isolation.toFixed(3)),
    levelRisk: Number(levelRisk.toFixed(3)),
    capacityRisk: Number(capacityRisk.toFixed(3)),
    score: Number(score.toFixed(3)),
  };
}

export function deriveStatusBand(score: number): StatusBand {
  if (score >= 75) {
    return 'secure';
  }
  if (score >= 50) {
    return 'watch';
  }
  return 'critical';
}

export function decliningTrend(flows: number[], currentFlow: number): boolean {
  if (flows.length < 3 || currentFlow >= 60) {
    return false;
  }
  const recent = flows.slice(-3);
  return recent[0] > recent[1] && recent[1] > recent[2];
}
