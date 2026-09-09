// ── Data Center Metrics ───────────────────────────────────────────────────────
export interface DataCenterMetrics {
  metrics_ID: number;
  power_CONSUMPTION_KW: number;
  waste_HEAT_GENERATED_KW: number;
  temperature_CELSIUS: number;
  pUE: number;
  timestamp: string;
}

// ── Ecosystem Demand ──────────────────────────────────────────────────────────
export interface EcosystemDemand {
  demand_ID: number;
  ecosystem_NAME: string;
  ecosystem_TYPE: number;  // 1=DistrictHeating, 2=Agriculture, 3=ThermalStorage, 4=Industry
  demand_VALUE_KW: number;
  min_TEMP_REQUIRED: number;
  max_TEMP_ACCEPTED: number;
  season_TYPE: number;     // 1=Winter, 2=Spring, 3=Summer, 4=Autumn
  season_NAME: string;
  priority: number;
  timestamp: string;
}

// ── Thermal Storage Status ────────────────────────────────────────────────────
export interface ThermalStorageStatus {
  storage_ID: number;
  storage_CAPACITY_KWH: number;
  current_STORED_HEAT_KWH: number;
  charge_PERCENTAGE: number;
  state: number;      // 0=Idle, 1=Charging, 2=Discharging
  state_NAME: string;
  charging_RATE_KW: number;
  discharging_RATE_KW: number;
  timestamp: string;
}

// ── Optimization Log ──────────────────────────────────────────────────────────
export interface OptimizationLog {
  log_ID: number;
  timestamp: string;
  action: string;
  details: string;
  heat_REDIRECTED_KW: number;
  target_ECOSYSTEM: string;
  supply_KW: number;
  total_DEMAND_KW: number;
  status: string; // 'SUCCESS' | 'PARTIAL' | 'DEFICIT'
}

// ── Heat Allocation Result ────────────────────────────────────────────────────
export interface HeatAllocation {
  timestamp: string;
  total_SUPPLY_KW: number;
  total_DEMAND_KW: number;
  is_SURPLUS: boolean;
  surplus_OR_DEFICIT_KW: number;
  district_HEATING_ALLOCATED_KW: number;
  agriculture_ALLOCATED_KW: number;
  thermal_STORAGE_ALLOCATED_KW: number;
  industry_ALLOCATED_KW: number;
  utilization_PERCENT: number;
  decisionNotes: string[];
  logs: OptimizationLog[];
}

// ── Optimization Request ──────────────────────────────────────────────────────
export interface OptimizationRequest {
  overridePowerKW: number;
  seasonType: number;
  outsideTemperatureCelsius: number;
  forceStorageDischarge: boolean;
}

// ── UI / Helper Types ─────────────────────────────────────────────────────────
export const SEASONS = [
  { value: 1, label: 'Winter', icon: '❄️' },
  { value: 2, label: 'Spring', icon: '🌸' },
  { value: 3, label: 'Summer', icon: '☀️' },
  { value: 4, label: 'Autumn', icon: '🍂' },
];

export const ECOSYSTEMS = [
  { type: 1, name: 'District Heating', icon: '🏘️', color: '#ef4444', priority: 2 },
  { type: 2, name: 'Agriculture',       icon: '🌿', color: '#22c55e', priority: 3 },
  { type: 3, name: 'Thermal Storage',   icon: '🔋', color: '#3b82f6', priority: 4 },
  { type: 4, name: 'Industry',          icon: '🏭', color: '#f97316', priority: 1 },
];

export interface EcosystemCard {
  name: string;
  icon: string;
  color: string;
  allocatedKW: number;
  demandKW: number;
  fillPercent: number;
  status: 'surplus' | 'met' | 'deficit';
}
