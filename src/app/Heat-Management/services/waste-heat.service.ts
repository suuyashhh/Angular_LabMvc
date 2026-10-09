import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface Tank {
  id: number;
  name: string;
  type: string;
  capacityKwh: number;
  storedEnergyKwh: number;
  fillPercentage: number;
  temperatureC: number;
  status: 'CHARGING' | 'DISCHARGING' | 'STORED' | 'STANDBY' | 'FULL' | 'EMPTY';
}

export interface DeliveryLog {
  timestamp: string;
  kwh: number;
  rateKw: number;
  tankId: number;
}

export interface Consumer {
  id: string;
  name: string;
  company: string;
  location: string;
  avatar: string;
  status: 'RECEIVING' | 'PAUSED' | 'COMPLETED' | 'IDLE';
  activeSourceTankId: number | null;
  preferredTankId: number | 'AUTO';
  autoSource: boolean;
  deliveryRateKw: number;
  deliveredEnergyKwh: number;
  requiredEnergyKwh: number;
  progressPercentage: number;
  contactPerson?: string;
  email?: string;
  tariff?: string;
  history?: DeliveryLog[];
}

export type AllocationMode = 'AUTO' | 'MANUAL';

export const INITIAL_TANKS: Tank[] = [
  {
    id: 1,
    name: 'Tank 01',
    type: 'Phase Change Latent Heat (PCM)',
    capacityKwh: 10.0,
    storedEnergyKwh: 8.0,
    fillPercentage: 80.0,
    temperatureC: 78,
    status: 'CHARGING'
  },
  {
    id: 2,
    name: 'Tank 02',
    type: 'Pressurized Stratified Buffer',
    capacityKwh: 20.0,
    storedEnergyKwh: 14.8,
    fillPercentage: 74.0,
    temperatureC: 78,
    status: 'DISCHARGING'
  },
  {
    id: 3,
    name: 'Tank 03',
    type: 'High-Temp Thermal Oil Vessel',
    capacityKwh: 15.0,
    storedEnergyKwh: 5.0,
    fillPercentage: 33.3,
    temperatureC: 78,
    status: 'STORED'
  },
  {
    id: 4,
    name: 'Tank 04',
    type: 'Latent Heat Matrix Salt',
    capacityKwh: 25.0,
    storedEnergyKwh: 0.0,
    fillPercentage: 0.0,
    temperatureC: 70,
    status: 'STANDBY'
  }
];

export const INITIAL_CONSUMERS: Consumer[] = [
  {
    id: 'cons-01',
    name: 'ABC Food Processing',
    company: 'Apex Agro & Foods Ltd.',
    location: 'Industrial Zone Bay-4',
    avatar: 'assets/img/avatars/industry-1.png',
    status: 'RECEIVING',
    activeSourceTankId: 2,
    preferredTankId: 2,
    autoSource: true,
    deliveryRateKw: 4.0,
    deliveredEnergyKwh: 14.11,
    requiredEnergyKwh: 25.0,
    progressPercentage: 56.4,
    contactPerson: 'Vikram Mehta (Chief Plant Mgr)',
    email: 'v.mehta@apexagro.com',
    tariff: '$0.078 / kWh',
    history: []
  },
  {
    id: 'cons-02',
    name: 'XYZ Textile Industry',
    company: 'Western Spinners & Weavers',
    location: 'Textile Cluster Phase 2',
    avatar: 'assets/img/avatars/industry-2.png',
    status: 'IDLE',
    activeSourceTankId: null,
    preferredTankId: 1,
    autoSource: false,
    deliveryRateKw: 2.5,
    deliveredEnergyKwh: 6.00,
    requiredEnergyKwh: 30.0,
    progressPercentage: 20.0,
    contactPerson: 'Anjali Sharma (Energy Lead)',
    email: 'asharma@westernspinners.org',
    tariff: '$0.065 / kWh',
    history: []
  },
  {
    id: 'cons-03',
    name: 'Industrial Dryer Unit #4',
    company: 'Aerodry Systems Corp',
    location: 'Sector 9 Thermal Hub',
    avatar: 'assets/img/avatars/industry-3.png',
    status: 'IDLE',
    activeSourceTankId: null,
    preferredTankId: 3,
    autoSource: true,
    deliveryRateKw: 3.0,
    deliveredEnergyKwh: 0.00,
    requiredEnergyKwh: 18.0,
    progressPercentage: 0.0,
    contactPerson: 'Marcus Cole (Facilities)',
    email: 'mcole@aerodrycorp.com',
    tariff: '$0.072 / kWh',
    history: []
  },
  {
    id: 'cons-04',
    name: 'Bio-Chem Refining Lab',
    company: 'Synthesis Bio-Processors',
    location: 'Biotech Science Park #12',
    avatar: 'assets/img/avatars/industry-4.png',
    status: 'COMPLETED',
    activeSourceTankId: null,
    preferredTankId: 2,
    autoSource: true,
    deliveryRateKw: 2.0,
    deliveredEnergyKwh: 15.00,
    requiredEnergyKwh: 15.0,
    progressPercentage: 100.0,
    contactPerson: 'Dr. Elena Rostova',
    email: 'elena@synthesisbio.io',
    tariff: '$0.085 / kWh',
    history: []
  }
];

const STORAGE_KEY = 'waste_heat_scada_state_v2';

@Injectable({
  providedIn: 'root'
})
export class WasteHeatService {
  private platformId = inject(PLATFORM_ID);

  // --- Core State Signals ---
  readonly heatOutputKw = signal<number>(1.0);
  readonly durationSeconds = signal<number>(300); // 5s or 300s (5 min)
  readonly simulationSpeed = signal<number>(10); // 1x, 10x, 60x for responsive simulation
  readonly isSimulating = signal<boolean>(true);

  // --- Storage Subsystem Signals ---
  readonly tanks = signal<Tank[]>(INITIAL_TANKS);
  readonly activeChargingTankId = signal<number | null>(1);
  readonly allocationMode = signal<AllocationMode>('AUTO');
  readonly priorityOrder = signal<number[]>([1, 2, 3, 4]);
  readonly manualSelectedTankId = signal<number>(1);

  // --- Consumers Signal ---
  readonly consumers = signal<Consumer[]>(INITIAL_CONSUMERS);

  // --- Computed SCADA KPIs ---
  readonly temperatureC = computed(() => {
    const kw = this.heatOutputKw();
    if (kw <= 0) return 38;
    // Exactly 70°C at 1.0 kW, 78°C at 2.5 kW, 88°C at 4.0 kW, 95°C at 5.0 kW
    return Math.round(55 + (kw / 5.0) * 40);
  });

  readonly serverStatus = computed<'Active' | 'Idle'>(() => {
    return this.heatOutputKw() > 0 ? 'Active' : 'Idle';
  });

  readonly energyStoredKJ = computed(() => {
    // Energy (kJ) = Power (kW) * Time (s)
    return parseFloat((this.heatOutputKw() * this.durationSeconds()).toFixed(1));
  });

  readonly energyStoredKwh = computed(() => {
    // 1 kWh = 3600 kJ
    return (this.energyStoredKJ() / 3600).toFixed(5);
  });

  readonly totalStoredKwh = computed(() => {
    return parseFloat(this.tanks().reduce((sum, t) => sum + t.storedEnergyKwh, 0).toFixed(2));
  });

  readonly totalCapacityKwh = computed(() => {
    return parseFloat(this.tanks().reduce((sum, t) => sum + t.capacityKwh, 0).toFixed(1));
  });

  readonly systemLevelPercentage = computed(() => {
    const cap = this.totalCapacityKwh();
    if (cap <= 0) return 0;
    return parseFloat(((this.totalStoredKwh() / cap) * 100).toFixed(1));
  });

  readonly headroomPercentage = computed(() => {
    return parseFloat((100 - this.systemLevelPercentage()).toFixed(1));
  });

  readonly avgStorageTemp = computed(() => {
    const activeTanks = this.tanks().filter(t => t.storedEnergyKwh > 0);
    if (activeTanks.length === 0) return 70;
    const sum = activeTanks.reduce((acc, t) => acc + t.temperatureC, 0);
    return Math.round(sum / activeTanks.length);
  });

  readonly activeSuppliesCount = computed(() => {
    return this.consumers().filter(c => c.status === 'RECEIVING').length;
  });

  readonly totalDeliveryPowerKw = computed(() => {
    return parseFloat(
      this.consumers()
        .filter(c => c.status === 'RECEIVING')
        .reduce((sum, c) => sum + c.deliveryRateKw, 0)
        .toFixed(1)
    );
  });

  readonly totalDeliveredKwh = computed(() => {
    return parseFloat(this.consumers().reduce((sum, c) => sum + c.deliveredEnergyKwh, 0).toFixed(1));
  });

  readonly activeChargingTank = computed(() => {
    const id = this.activeChargingTankId();
    if (!id) return null;
    return this.tanks().find(t => t.id === id) || null;
  });

  private timerInterval: any = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromLocalStorage();
      this.startSimulationLoop();
    }
  }

  // --- Data Server Actions ---
  setHeatOutput(kw: number): void {
    const clamped = Math.max(0, Math.min(5.0, Number(kw) || 0));
    this.heatOutputKw.set(clamped);
    this.saveToLocalStorage();
  }

  setDuration(seconds: number): void {
    this.durationSeconds.set(seconds);
    this.saveToLocalStorage();
  }

  // --- Storage Controls & Configuration ---
  setAllocationMode(mode: AllocationMode): void {
    this.allocationMode.set(mode);
    this.saveToLocalStorage();
  }

  selectManualTank(tankId: number): void {
    this.manualSelectedTankId.set(tankId);
    this.saveToLocalStorage();
  }

  setPriorityOrder(order: number[]): void {
    // Validate that order has 4 distinct tank ids
    const valid = Array.from(new Set(order.filter(id => id >= 1 && id <= 4)));
    if (valid.length === 4) {
      this.priorityOrder.set(valid);
      this.saveToLocalStorage();
    }
  }

  updateTankCapacities(capacities: { [tankId: number]: number }): void {
    this.tanks.update(tanks =>
      tanks.map(t => {
        const rawCap = capacities[t.id];
        const newCap = rawCap !== undefined && rawCap > 0 ? parseFloat(rawCap.toFixed(1)) : t.capacityKwh;
        const stored = parseFloat(Math.min(t.storedEnergyKwh, newCap).toFixed(2));
        const fill = parseFloat(((stored / newCap) * 100).toFixed(1));
        return {
          ...t,
          capacityKwh: newCap,
          storedEnergyKwh: stored,
          fillPercentage: fill
        };
      })
    );
    this.saveToLocalStorage();
  }

  resetStorage(): void {
    this.tanks.set(INITIAL_TANKS.map(t => ({ ...t })));
    this.consumers.set(INITIAL_CONSUMERS.map(c => ({ ...c })));
    this.heatOutputKw.set(1.0);
    this.durationSeconds.set(300);
    this.saveToLocalStorage();
  }

  setSimulationSpeed(speed: number): void {
    this.simulationSpeed.set(speed);
  }

  toggleSimulationPause(): void {
    this.isSimulating.set(!this.isSimulating());
  }

  // --- Heat Consumer Actions ---
  toggleSupply(consumerId: string): void {
    const c = this.consumers().find(x => x.id === consumerId);
    if (!c) return;

    if (c.status === 'RECEIVING') {
      this.pauseSupply(consumerId);
    } else if (c.status === 'PAUSED' || c.status === 'IDLE') {
      this.startSupply(consumerId);
    } else if (c.status === 'COMPLETED') {
      // Restart cycle
      this.updateConsumer(consumerId, {
        deliveredEnergyKwh: 0,
        progressPercentage: 0,
        status: 'RECEIVING'
      });
      this.startSupply(consumerId);
    }
  }

  startSupply(consumerId: string): void {
    this.consumers.update(list =>
      list.map(c => {
        if (c.id === consumerId) {
          // Find source tank
          const sourceId = this.findAvailableSourceTank(c);
          return {
            ...c,
            status: sourceId !== null ? 'RECEIVING' : 'PAUSED',
            activeSourceTankId: sourceId
          };
        }
        return c;
      })
    );
    this.saveToLocalStorage();
  }

  pauseSupply(consumerId: string): void {
    this.consumers.update(list =>
      list.map(c => {
        if (c.id === consumerId) {
          return { ...c, status: 'PAUSED', activeSourceTankId: null };
        }
        return c;
      })
    );
    this.saveToLocalStorage();
  }

  stopSupply(consumerId: string): void {
    this.consumers.update(list =>
      list.map(c => {
        if (c.id === consumerId) {
          return { ...c, status: 'IDLE', activeSourceTankId: null };
        }
        return c;
      })
    );
    this.saveToLocalStorage();
  }

  setConsumerDeliveryRate(consumerId: string, rateKw: number): void {
    const clamped = Math.max(0.1, Math.min(10.0, parseFloat(rateKw.toFixed(1))));
    this.consumers.update(list =>
      list.map(c => (c.id === consumerId ? { ...c, deliveryRateKw: clamped } : c))
    );
    this.saveToLocalStorage();
  }

  setConsumerPreferredTank(consumerId: string, tankId: number | 'AUTO'): void {
    this.consumers.update(list =>
      list.map(c => {
        if (c.id === consumerId) {
          const updated: Consumer = { ...c, preferredTankId: tankId };
          if (updated.status === 'RECEIVING') {
            updated.activeSourceTankId = this.findAvailableSourceTank(updated);
          }
          return updated;
        }
        return c;
      })
    );
    this.saveToLocalStorage();
  }

  toggleConsumerAutoSource(consumerId: string): void {
    this.consumers.update(list =>
      list.map(c => {
        if (c.id === consumerId) {
          const updated: Consumer = { ...c, autoSource: !c.autoSource };
          if (updated.status === 'RECEIVING') {
            updated.activeSourceTankId = this.findAvailableSourceTank(updated);
          }
          return updated;
        }
        return c;
      })
    );
    this.saveToLocalStorage();
  }

  addConsumer(data: Partial<Consumer>): void {
    const newId = `cons-${Date.now().toString().slice(-4)}`;
    const newConsumer: Consumer = {
      id: newId,
      name: data.name?.trim() || 'New Industrial Facility',
      company: data.company?.trim() || 'Enterprise Plant',
      location: data.location?.trim() || 'Industrial Sector 5',
      avatar: data.avatar || `assets/img/avatars/industry-${(this.consumers().length % 4) + 1}.png`,
      status: 'IDLE',
      activeSourceTankId: null,
      preferredTankId: data.preferredTankId || 'AUTO',
      autoSource: data.autoSource ?? true,
      deliveryRateKw: data.deliveryRateKw || 2.5,
      deliveredEnergyKwh: 0,
      requiredEnergyKwh: data.requiredEnergyKwh || 20.0,
      progressPercentage: 0,
      contactPerson: data.contactPerson?.trim() || 'Plant Operations Lead',
      email: data.email?.trim() || 'ops@industrial.corp',
      tariff: data.tariff?.trim() || '$0.075 / kWh',
      history: []
    };

    this.consumers.update(list => [newConsumer, ...list]);
    this.saveToLocalStorage();
  }

  updateConsumer(consumerId: string, data: Partial<Consumer>): void {
    this.consumers.update(list =>
      list.map(c => {
        if (c.id === consumerId) {
          const updated = { ...c, ...data };
          if (updated.requiredEnergyKwh > 0) {
            updated.progressPercentage = parseFloat(
              Math.min(100, (updated.deliveredEnergyKwh / updated.requiredEnergyKwh) * 100).toFixed(1)
            );
          }
          if (updated.status === 'RECEIVING') {
            updated.activeSourceTankId = this.findAvailableSourceTank(updated);
          }
          return updated;
        }
        return c;
      })
    );
    this.saveToLocalStorage();
  }

  deleteConsumer(consumerId: string): void {
    this.consumers.update(list => list.filter(c => c.id !== consumerId));
    this.saveToLocalStorage();
  }

  getTank(tankId: number): Tank | undefined {
    return this.tanks().find(t => t.id === tankId);
  }

  private findAvailableSourceTank(consumer: Consumer): number | null {
    const currentTanks = this.tanks();
    if (consumer.preferredTankId !== 'AUTO') {
      const preferred = currentTanks.find(t => t.id === consumer.preferredTankId);
      if (preferred && preferred.storedEnergyKwh > 0.1) {
        return preferred.id;
      }
    }

    if (consumer.autoSource || consumer.preferredTankId === 'AUTO') {
      // Find tank with highest stored energy
      const available = currentTanks
        .filter(t => t.storedEnergyKwh > 0.1)
        .sort((a, b) => b.storedEnergyKwh - a.storedEnergyKwh);
      if (available.length > 0) {
        return available[0].id;
      }
    }

    return null;
  }

  // --- Real-Time Simulation Engine Loop ---
  private startSimulationLoop(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (!this.isSimulating()) return;
      this.simulationTick();
    }, 1000);
  }

  private simulationTick(): void {
    const speed = this.simulationSpeed();
    const heatKw = this.heatOutputKw();
    const currentTanks = this.tanks().map(t => ({ ...t }));
    const currentConsumers = this.consumers().map(c => ({ ...c }));

    // 1. CHARGING STEP (Server Heat -> Thermal Storage Tank)
    let chargingTankId: number | null = null;
    if (heatKw > 0) {
      if (this.allocationMode() === 'MANUAL') {
        const manualId = this.manualSelectedTankId();
        const target = currentTanks.find(t => t.id === manualId);
        if (target && target.storedEnergyKwh < target.capacityKwh - 0.01) {
          chargingTankId = target.id;
        }
      } else {
        // Automatic Sequential Allocation based on priority order
        for (const tid of this.priorityOrder()) {
          const t = currentTanks.find(x => x.id === tid);
          if (t && t.storedEnergyKwh < t.capacityKwh - 0.05) {
            chargingTankId = t.id;
            break;
          }
        }
      }

      if (chargingTankId !== null) {
        // Energy in kWh added per second = (kW / 3600) * speed
        const energyAdded = (heatKw / 3600) * speed;
        const targetTank = currentTanks.find(t => t.id === chargingTankId);
        if (targetTank) {
          const newStored = Math.min(targetTank.capacityKwh, targetTank.storedEnergyKwh + energyAdded);
          targetTank.storedEnergyKwh = parseFloat(newStored.toFixed(3));
          targetTank.fillPercentage = parseFloat(((newStored / targetTank.capacityKwh) * 100).toFixed(1));
          targetTank.temperatureC = Math.min(95, Math.round(65 + (targetTank.fillPercentage / 100) * 25));
        }
      }
    }
    this.activeChargingTankId.set(chargingTankId);

    // 2. DISCHARGING STEP (Storage Tanks -> Heat Consumers)
    const activeConsumers = currentConsumers.filter(c => c.status === 'RECEIVING');
    for (const c of activeConsumers) {
      let sourceTank: Tank | undefined;

      // Check preferred tank first
      if (c.preferredTankId !== 'AUTO') {
        sourceTank = currentTanks.find(t => t.id === c.preferredTankId && t.storedEnergyKwh > 0.05);
      }

      // If preferred is dry or autoSource is active, auto select the richest tank
      if (!sourceTank && (c.autoSource || c.preferredTankId === 'AUTO')) {
        sourceTank = currentTanks
          .filter(t => t.storedEnergyKwh > 0.05)
          .sort((a, b) => b.storedEnergyKwh - a.storedEnergyKwh)[0];
      }

      if (sourceTank) {
        c.activeSourceTankId = sourceTank.id;
        const maxEnergyDrawn = (c.deliveryRateKw / 3600) * speed;
        const remainingDemand = Math.max(0, c.requiredEnergyKwh - c.deliveredEnergyKwh);
        const actualDrawn = Math.min(sourceTank.storedEnergyKwh, maxEnergyDrawn, remainingDemand);

        if (actualDrawn > 0) {
          // Deduct from tank
          sourceTank.storedEnergyKwh = parseFloat(Math.max(0, sourceTank.storedEnergyKwh - actualDrawn).toFixed(3));
          sourceTank.fillPercentage = parseFloat(((sourceTank.storedEnergyKwh / sourceTank.capacityKwh) * 100).toFixed(1));
          sourceTank.temperatureC = Math.max(45, Math.round(50 + (sourceTank.fillPercentage / 100) * 35));

          // Add to consumer
          c.deliveredEnergyKwh = parseFloat((c.deliveredEnergyKwh + actualDrawn).toFixed(3));
          c.progressPercentage = parseFloat(Math.min(100, (c.deliveredEnergyKwh / c.requiredEnergyKwh) * 100).toFixed(1));

          if (c.deliveredEnergyKwh >= c.requiredEnergyKwh - 0.01) {
            c.status = 'COMPLETED';
            c.activeSourceTankId = null;
          }
        }
      } else {
        // No energy available in any applicable tank
        c.activeSourceTankId = null;
        c.status = 'PAUSED';
      }
    }

    // 3. UPDATE TANK STATUS FLAGS ACCORDING TO SYSTEM STATE
    const dischargingTankIds = new Set(
      currentConsumers.filter(c => c.status === 'RECEIVING' && c.activeSourceTankId !== null).map(c => c.activeSourceTankId!)
    );

    for (const t of currentTanks) {
      const isCharging = t.id === chargingTankId;
      const isDischarging = dischargingTankIds.has(t.id);

      if (isCharging) {
        t.status = t.fillPercentage >= 99.8 ? 'FULL' : 'CHARGING';
      } else if (isDischarging) {
        t.status = 'DISCHARGING';
      } else if (t.fillPercentage >= 99.5) {
        t.status = 'FULL';
      } else if (t.fillPercentage <= 0.5) {
        t.status = 'STANDBY';
      } else {
        t.status = 'STORED';
      }
    }

    this.tanks.set(currentTanks);
    this.consumers.set(currentConsumers);
  }

  // --- Persistence ---
  private saveToLocalStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const state = {
        heatOutputKw: this.heatOutputKw(),
        durationSeconds: this.durationSeconds(),
        allocationMode: this.allocationMode(),
        priorityOrder: this.priorityOrder(),
        manualSelectedTankId: this.manualSelectedTankId(),
        tanks: this.tanks(),
        consumers: this.consumers()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save Waste Heat state to localStorage', e);
    }
  }

  private loadFromLocalStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.heatOutputKw !== undefined) this.heatOutputKw.set(parsed.heatOutputKw);
        if (parsed.durationSeconds !== undefined) this.durationSeconds.set(parsed.durationSeconds);
        if (parsed.allocationMode) this.allocationMode.set(parsed.allocationMode);
        if (parsed.priorityOrder && Array.isArray(parsed.priorityOrder)) this.priorityOrder.set(parsed.priorityOrder);
        if (parsed.manualSelectedTankId) this.manualSelectedTankId.set(parsed.manualSelectedTankId);
        if (parsed.tanks && Array.isArray(parsed.tanks) && parsed.tanks.length === 4) {
          this.tanks.set(parsed.tanks);
        }
        if (parsed.consumers && Array.isArray(parsed.consumers)) {
          this.consumers.set(parsed.consumers);
        }
      }
    } catch (e) {
      console.warn('Failed to load Waste Heat state from localStorage', e);
    }
  }
}
