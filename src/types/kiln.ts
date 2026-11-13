export enum AppScreen {
  OVERVIEW = 'overview',
  KILN_CONTROL = 'kilns',
  BATCH_LEDGER = 'batches',
  PREDICTIVE_LAB = 'predictions',
  ENERGY_SUPPLY = 'energy',
}

export enum BatchStatus {
  FIRING = 'Firing',
  COOLING = 'Cooling',
  PASSED_QC = 'Passed QC',
  HOLD_REVIEW = 'Hold / Review',
}

export enum KilnState {
  FIRING = 'Firing',
  SOAKING = 'Soaking',
  COOLING = 'Cooling',
  STANDBY = 'Standby',
}

export type FacilityId = 'all' | 'ohio' | 'bavaria' | 'nagoya';

export interface ThermalZone {
  zoneNumber: number;
  name: string;
  stage: 'Preheating' | 'Firing' | 'Cooling';
  positionMeters: number;
  actualTempC: number;
  targetTempC: number;
  aiOptimalTempC: number;
  burnerDutyPct: number;
  oxygenPct: number;
  aiAutoTrim: boolean;
}

export interface KilnUnit {
  id: string;
  name: string;
  shortCode: string;
  facilityId: Exclude<FacilityId, 'all'>;
  facilityName: string;
  type: 'Continuous Tunnel' | 'Roller Hearth' | 'Gas Shuttle';
  state: KilnState;
  activeBatchId: string;
  ceramicBody: string;
  peakTempC: number;
  thermalEfficiencyPct: number;
  draftPressurePa: number;
  exhaustO2Pct: number;
  gasFlowM3Hr: number;
  predictedYieldPct: number;
  zones: ThermalZone[];
}

export interface FiringBatch {
  id: string;
  orderRef: string;
  ceramicBody: string;
  facilityId: Exclude<FacilityId, 'all'>;
  facilityName: string;
  kilnId: string;
  kilnName: string;
  coneTarget: string;
  peakTempC: number;
  cycleDurationHrs: number;
  elapsedHrs: number;
  predictedYieldPct: number;
  actualYieldPct: number | null;
  defectRatePct: number;
  shrinkagePct: number;
  porosityPct: number;
  energyMWh: number;
  status: BatchStatus;
  startedAt: string;
  notes: string;
}

export interface AIAdvisory {
  id: string;
  kilnId: string;
  kilnName: string;
  zoneLabel: string;
  severity: 'Optimization' | 'Thermal Drift' | 'Energy Window';
  title: string;
  rationale: string;
  impactMetric: string;
  deltaTempC?: number;
  targetZoneNumber?: number;
  yieldGainPct: number;
  efficiencyGainPct: number;
  resolved: boolean;
}

export interface RefractoryAsset {
  id: string;
  kilnId: string;
  kilnName: string;
  component: string;
  materialSpec: string;
  cyclesCompleted: number;
  ratedCycles: number;
  remainingDays: number;
  wearRisk: 'Low' | 'Moderate' | 'Scheduled';
  scheduledAction: string;
  maintenanceBooked: boolean;
}

export interface RawMaterialSilo {
  id: string;
  materialName: string;
  grade: string;
  facilityName: string;
  currentTons: number;
  capacityTons: number;
  dailyBurnTons: number;
  moisturePct: number;
  reorderThresholdTons: number;
  poIssued: boolean;
}

export interface FiringRecipePreset {
  id: string;
  name: string;
  ceramicBody: string;
  peakTempC: number;
  rampRateCPerHr: number;
  soakMinutes: number;
  oxygenPct: number;
  baselineYieldPct: number;
}
