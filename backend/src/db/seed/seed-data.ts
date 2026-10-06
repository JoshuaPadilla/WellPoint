import {
  DisruptionReason,
  ServiceLevel,
  WaterQuality,
  WaterSourceStatus,
  WaterSourceType,
} from '../../entities/enums';

export const BASE_SEED = 20261006;
export const BASE_TIME_MS = Date.UTC(2026, 9, 6, 0, 0, 0);
export const TICK_INTERVAL_MS = 60 * 60 * 1000;
export const TICKS_PER_SYSTEM = 6;

export interface PilotSourceDef {
  name: string;
  type: WaterSourceType;
  offsetLat: number;
  offsetLng: number;
  capacity: number;
  status: WaterSourceStatus;
}

export interface StatusTick {
  available: boolean;
  flow: number;
  quality: WaterQuality;
  reason: DisruptionReason | null;
}

export interface PilotSystemDef {
  psgcCode: string;
  name: string;
  level: ServiceLevel;
  coverageArea: string;
  serviceHours: number;
  operator: string;
  affordability: number;
  population: number;
  sources: PilotSourceDef[];
  ticks: StatusTick[];
}

const tick = (
  available: boolean,
  flow: number,
  quality: WaterQuality,
  reason: DisruptionReason | null = null,
): StatusTick => ({ available, flow, quality, reason });

export const PILOT_SYSTEMS: PilotSystemDef[] = [
  {
    psgcCode: '0806005034',
    name: 'Poblacion 1 Water System',
    level: ServiceLevel.III,
    coverageArea: 'Poblacion 1',
    serviceHours: 24,
    operator: 'Catbalogan Water District',
    affordability: 80,
    population: 8500,
    sources: [
      {
        name: 'Catbalogan River Intake',
        type: WaterSourceType.RIVER,
        offsetLat: 0.002,
        offsetLng: 0.001,
        capacity: 12000,
        status: WaterSourceStatus.OK,
      },
      {
        name: 'Poblacion Reservoir',
        type: WaterSourceType.RESERVOIR,
        offsetLat: -0.001,
        offsetLng: 0.002,
        capacity: 8000,
        status: WaterSourceStatus.OK,
      },
    ],
    ticks: [
      tick(true, 86, WaterQuality.SAFE),
      tick(true, 88, WaterQuality.SAFE),
      tick(true, 90, WaterQuality.SAFE),
      tick(true, 89, WaterQuality.SAFE),
      tick(true, 90, WaterQuality.SAFE),
      tick(true, 91, WaterQuality.SAFE),
    ],
  },
  {
    psgcCode: '0806005051',
    name: 'San Andres Spring System',
    level: ServiceLevel.II,
    coverageArea: 'San Andres',
    serviceHours: 18,
    operator: 'Barangay Water Association',
    affordability: 55,
    population: 4200,
    sources: [
      {
        name: 'San Andres Spring',
        type: WaterSourceType.SPRING,
        offsetLat: 0.003,
        offsetLng: -0.002,
        capacity: 3000,
        status: WaterSourceStatus.OK,
      },
    ],
    ticks: [
      tick(true, 58, WaterQuality.SAFE),
      tick(true, 57, WaterQuality.SAFE),
      tick(true, 58, WaterQuality.SAFE),
      tick(true, 59, WaterQuality.SAFE),
      tick(true, 58, WaterQuality.SAFE),
      tick(true, 59, WaterQuality.SAFE),
    ],
  },
  {
    psgcCode: '0806005027',
    name: 'Mercedes Groundwater System',
    level: ServiceLevel.II,
    coverageArea: 'Mercedes',
    serviceHours: 20,
    operator: 'Barangay Water Association',
    affordability: 50,
    population: 3000,
    sources: [
      {
        name: 'Mercedes Groundwater Well',
        type: WaterSourceType.GROUNDWATER,
        offsetLat: -0.002,
        offsetLng: -0.001,
        capacity: 2500,
        status: WaterSourceStatus.OK,
      },
    ],
    ticks: [
      tick(true, 70, WaterQuality.SAFE),
      tick(true, 68, WaterQuality.SAFE),
      tick(false, 0, WaterQuality.SAFE, DisruptionReason.MAINTENANCE),
      tick(false, 0, WaterQuality.SAFE, DisruptionReason.MAINTENANCE),
      tick(true, 65, WaterQuality.SAFE),
      tick(true, 68, WaterQuality.SAFE),
    ],
  },
  {
    psgcCode: '0806005003',
    name: 'Bangon Spring System',
    level: ServiceLevel.I,
    coverageArea: 'Bangon',
    serviceHours: 12,
    operator: 'Barangay Council',
    affordability: 30,
    population: 2500,
    sources: [
      {
        name: 'Bangon Spring',
        type: WaterSourceType.SPRING,
        offsetLat: 0.004,
        offsetLng: 0.003,
        capacity: 1200,
        status: WaterSourceStatus.LOW,
      },
    ],
    ticks: [
      tick(true, 34, WaterQuality.SAFE),
      tick(true, 33, WaterQuality.SAFE),
      tick(true, 35, WaterQuality.SAFE),
      tick(true, 34, WaterQuality.SAFE),
      tick(true, 33, WaterQuality.SAFE),
      tick(true, 34, WaterQuality.SAFE),
    ],
  },
  {
    psgcCode: '0806005014',
    name: 'Canlapwas Spring System',
    level: ServiceLevel.I,
    coverageArea: 'Canlapwas',
    serviceHours: 10,
    operator: 'Barangay Council',
    affordability: 25,
    population: 1500,
    sources: [
      {
        name: 'Canlapwas Spring',
        type: WaterSourceType.SPRING,
        offsetLat: -0.003,
        offsetLng: 0.004,
        capacity: 900,
        status: WaterSourceStatus.CONTAMINATED,
      },
    ],
    ticks: [
      tick(true, 48, WaterQuality.SAFE),
      tick(true, 47, WaterQuality.SAFE),
      tick(true, 46, WaterQuality.SAFE),
      tick(true, 45, WaterQuality.SAFE),
      tick(true, 45, WaterQuality.SAFE),
      tick(true, 45, WaterQuality.UNSAFE, DisruptionReason.CONTAMINATION),
    ],
  },
];

export const PILOT_PSGC_BY_NAME: Record<string, string> = {
  'Poblacion 1': '0806005034',
  'San Andres': '0806005051',
  Mercedes: '0806005027',
  Bangon: '0806005003',
  Canlapwas: '0806005014',
};

export const POBLACION_CENTER_PSGC = '0806005034';
