import { Injectable, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface Tank {
  id: number;
  name: string;
  type: string;
  capacityKwh: number;
  storedEnergyKwh: number;
  fillPercentage: number;
  temperatureC: number;
  status: 'CHARGING' | 'DISCHARGING' | 'IDLE' | 'FULL' | 'EMPTY';
}

export interface Consumer {
  id: string;
  name: string;
  company: string;
  avatar: string;
  status: 'RECEIVING' | 'PAUSED' | 'COMPLETED' | 'ACTIVE' | 'IDLE';
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
}

export type AllocationMode = 'AUTO' | 'MANUAL';

const INITIAL_TANKS: Tank[] = [
  {
    id: 1,
    name: 'Buffer Tank 01',
    type: 'Phase Change Material (PCM)',
    capacityKwh: 3000,
    storedEnergyKwh: 2470,
    fillPercentage: 82.3,
    temperatureC: 78.5,
    status: 'CHARGING'
  },
  {
    id: 2,
    name: 'Buffer Tank 02',
    type: 'Stratified Pressurized Water',
    capacityKwh: 3000,
    storedEnergyKwh: 1920,
    fillPercentage: 64.0,
    temperatureC: 62.0,
    status: 'IDLE'
  },
  {
    id: 3,
    name: 'Buffer Tank 03',
    type: 'High-Temp Thermal Oil',
    capacityKwh: 3000,
    storedEnergyKwh: 1250,
    fillPercentage: 41.6,
    temperatureC: 54.0,
    status: 'DISCHARGING'
  },
  {
    id: 4,
    name: 'Buffer Tank 04',
    type: 'Latent Heat Matrix Salt',
    capacityKwh: 3500,
    storedEnergyKwh: 680,
    fillPercentage: 19.4,
    temperatureC: 45.0,
    status: 'IDLE'
  }
];

const INITIAL_CONSUMERS: Consumer[] = [
  {
    id: 'cons-01',
    name: 'District Loop Alpha',
    company: 'Metropolitan District Heating',
    avatar: 'assets/img/avatars/district-1.png',
    status: 'RECEIVING',
    activeSourceTankId: 3,
    preferredTankId: 'AUTO',
    autoSource: true,
    deliveryRateKw: 2.4,
    deliveredEnergyKwh: 1420,
    requiredEnergyKwh: 2000,
    progressPercentage: 71.0,
    contactPerson: 'Marcus Vance (Grid Mgr)',
    email: 'm.vance@districtheat.city',
    tariff: '$0.078 / kWh'
  },
  {
    id: 'cons-02',
    name: 'Absorption Chiller Unit',
    company: 'ColdFlow Thermal HVAC',
    avatar: 'assets/img/avatars/chiller-2.png',
    status: 'RECEIVING',
    activeSourceTankId: 2,
    preferredTankId: 2,
    autoSource: true,
    deliveryRateKw: 1.2,
    deliveredEnergyKwh: 680,
    requiredEnergyKwh: 1200,
    progressPercentage: 56.6,
    contactPerson: 'Elena Rostova',
    email: 'elena@coldflow.io',
    tariff: '$0.065 / kWh'
  },
  {
    id: 'cons-03',
    name: 'Factory Sanitation DHW',
    company: 'CleanLoop Industrial',
    avatar: 'assets/img/avatars/dhw-3.png',
    status: 'PAUSED',
    activeSourceTankId: null,
    preferredTankId: 1,
    autoSource: false,
    deliveryRateKw: 1.0,
    deliveredEnergyKwh: 340,
    requiredEnergyKwh: 800,
    progressPercentage: 42.5,
    contactPerson: 'David Chen',
    email: 'd.chen@cleanloop.com',
    tariff: '$0.072 / kWh'
  },
  {
    id: 'cons-04',
    name: 'Greenhouse Soil Heater',
    company: 'AgriTherm Hydroponics',
    avatar: 'assets/img/avatars/greenhouse-4.png',
    status: 'COMPLETED',
    activeSourceTankId: null,
    preferredTankId: 'AUTO',
    autoSource: true,
    deliveryRateKw: 0.8,
    deliveredEnergyKwh: 500,
    requiredEnergyKwh: 500,
    progressPercentage: 100,
    contactPerson: 'Sarah Lin',
    email: 'sarah@agritherm.org',
    tariff: '$0.055 / kWh'
  }
];

const STORAGE_KEY = 'waste_heat_simulation_state_v1';

@Injectable({
  providedIn: 'root'
})
export class WasteHeatService {
  private platformId = inject(PLATFORM_ID);

  // --- Core Simulation Signals ---
  readonly heatOutputKw = signal<number>(1.0);
  readonly durationSeconds = signal<number>(300);
  readonly simulationSpeed = signal<number>(1);
  readonly isSimulating = signal<boolean>(true);

  // --- Storage System Signals ---
  readonly tanks = signal<Tank[]>(INITIAL_TANKS);
  readonly activeChargingTankId = signal<number | null>(1);
  readonly allocationMode = signal<AllocationMode>('AUTO');
  readonly priorityOrder = signal<number[]>([1, 2, 3, 4]);
  readonly manualSelectedTankId = signal<number>(1);

  // --- Consumers Signal ---
  readonly consumers = signal<Consumer[]>(INITIAL_CONSUMERS);

  // --- Derived / Computed Values ---
  readonly temperatureC = computed(() => {
    const kw = this.heatOutputKw();
    if (kw <= 0) return 38;
    return Math.round(40 + (kw / 5.0) * 55); // 40°C to 95°C
  });

  readonly serverStatus = computed<'ACTIVE' | 'IDLE'>(() => {
    return this.heatOutputKw() > 0 ? 'ACTIVE' : 'IDLE';
  });

  readonly heatIntensityRatio = computed(() => {
    return Math.min(1.0, Math.max(0, this.heatOutputKw() / 5.0));
  });

  readonly energyStoredKJ = computed(() => {
    return parseFloat((this.heatOutputKw() * this.durationSeconds()).toFixed(1));
  });

  readonly energyStoredKwh = computed(() => {
    return (this.energyStoredKJ() / 3600).toFixed(4);
  });

  readonly totalStoredKwh = computed(() => {
    return Math.round(this.tanks().reduce((sum, t) => sum + t.storedEnergyKwh, 0));
  });

  readonly totalCapacityKwh = computed(() => {
    return Math.round(this.tanks().reduce((sum, t) => sum + t.capacityKwh, 0));
  });

  readonly systemLevelPercentage = computed(() => {
    const cap = this.totalCapacityKwh();
    if (cap <= 0) return 0;
    return parseFloat(((this.totalStoredKwh() / cap) * 100).toFixed(1));
  });

  readonly activeSuppliesCount = computed(() => {
    return this.consumers().filter(c => c.status === 'RECEIVING' || c.status === 'ACTIVE').length;
  });

  readonly activeSuppliesKw = computed(() => {
    return parseFloat(
      this.consumers()
        .filter(c => c.status === 'RECEIVING' || c.status === 'ACTIVE')
        .reduce((sum, c) => sum + c.deliveryRateKw, 0)
        .toFixed(2)
    );
  });

  readonly totalDeliveredKwh = computed(() => {
    return Math.round(this.consumers().reduce((sum, c) => sum + c.deliveredEnergyKwh, 0));
  });

  readonly activeChargingTankName = computed(() => {
    const id = this.activeChargingTankId();
    if (!id) return 'None (Standby)';
    const tank = this.tanks().find(t => t.id === id);
    return tank ? tank.name : `Tank 0${id}`;
  });

  readonly isAnyTankFull = computed(() => {
    return this.tanks().some(t => t.fillPercentage >= 99.5);
  });

  readonly isAnyTankEmpty = computed(() => {
    return this.tanks().some(t => t.fillPercentage <= 0.5);
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

  // --- Thermal Storage Actions ---
  setAllocationMode(mode: AllocationMode): void {
    this.allocationMode.set(mode);
    this.saveToLocalStorage();
  }

  selectManualTank(tankId: number): void {
    this.manualSelectedTankId.set(tankId);
    this.saveToLocalStorage();
  }

  setPriorityOrder(order: number[]): void {
    this.priorityOrder.set(order);
    this.saveToLocalStorage();
  }

  updateTankCapacities(capacities: { [tankId: number]: number }): void {
    this.tanks.update(tanks =>
      tanks.map(t => {
        const newCap = capacities[t.id] ?? t.capacityKwh;
        const stored = Math.min(t.storedEnergyKwh, newCap);
        const fill = parseFloat(((stored / newCap) * 100).toFixed(1));
        return { ...t, capacityKwh: newCap, storedEnergyKwh: stored, fillPercentage: fill };
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
    this.simulationSpeed.set(Math.max(1, Math.min(10, speed)));
  }

  // --- Consumer Management Actions ---
  toggleSupply(consumerId: string): void {
    const c = this.consumers().find(x => x.id === consumerId);
    if (!c) return;

    if (c.status === 'RECEIVING' || c.status === 'ACTIVE') {
      this.pauseSupply(consumerId);
    } else if (c.status === 'PAUSED' || c.status === 'IDLE') {
      this.startSupply(consumerId);
    } else if (c.status === 'COMPLETED') {
      this.updateConsumer(consumerId, {
        deliveredEnergyKwh: 0,
        progressPercentage: 0,
        status: 'RECEIVING'
      });
    }
  }

  startSupply(consumerId: string): void {
    this.consumers.update(list =>
      list.map(c => {
        if (c.id === consumerId) {
          if (c.deliveredEnergyKwh >= c.requiredEnergyKwh) {
            return { ...c, deliveredEnergyKwh: 0, progressPercentage: 0, status: 'RECEIVING' };
          }
          return { ...c, status: 'RECEIVING' };
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

  resumeSupply(consumerId: string): void {
    this.startSupply(consumerId);
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
    const clamped = Math.max(0.1, Math.min(10.0, rateKw));
    this.consumers.update(list =>
      list.map(c => (c.id === consumerId ? { ...c, deliveryRateKw: clamped } : c))
    );
    this.saveToLocalStorage();
  }

  setConsumerPreferredTank(consumerId: string, tankId: number | 'AUTO'): void {
    this.consumers.update(list =>
      list.map(c => (c.id === consumerId ? { ...c, preferredTankId: tankId } : c))
    );
    this.saveToLocalStorage();
  }

  toggleConsumerAutoSource(consumerId: string): void {
    this.consumers.update(list =>
      list.map(c => (c.id === consumerId ? { ...c, autoSource: !c.autoSource } : c))
    );
    this.saveToLocalStorage();
  }

  addConsumer(data: Partial<Consumer>): void {
    const newConsumer: Consumer = {
      id: `cons-${Date.now().toString().slice(-4)}`,
      name: data.name || 'New Offtaker',
      company: data.company || 'Industrial Facility',
      avatar: data.avatar || 'assets/img/avatars/default.png',
      status: 'IDLE',
      activeSourceTankId: null,
      preferredTankId: data.preferredTankId || 'AUTO',
      autoSource: data.autoSource ?? true,
      deliveryRateKw: data.deliveryRateKw || 1.0,
      deliveredEnergyKwh: 0,
      requiredEnergyKwh: data.requiredEnergyKwh || 1000,
      progressPercentage: 0,
      contactPerson: data.contactPerson || '',
      email: data.email || '',
      tariff: data.tariff || '$0.070 / kWh'
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

  uploadConsumerImage(consumerId: string, base64: string): void {
    this.updateConsumer(consumerId, { avatar: base64 });
  }

  // --- Simulation Engine Loop ---
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
    const currentTanks = [...this.tanks()];
    const currentConsumers = [...this.consumers()];

    // 1. CHARGING STEP (Server -> Active Tank)
    let chargingTankId: number | null = null;
    if (heatKw > 0) {
      if (this.allocationMode() === 'MANUAL') {
        const manualId = this.manualSelectedTankId();
        const target = currentTanks.find(t => t.id === manualId);
        if (target && target.storedEnergyKwh < target.capacityKwh) {
          chargingTankId = target.id;
        }
      } else {
        // Auto: find first tank in priority order that has space
        for (const tid of this.priorityOrder()) {
          const t = currentTanks.find(x => x.id === tid);
          if (t && t.storedEnergyKwh < t.capacityKwh - 0.1) {
            chargingTankId = t.id;
            break;
          }
        }
      }

      if (chargingTankId !== null) {
        // Energy in kWh added per second = (kW / 3600) * speed
        const energyAdded = (heatKw / 3600) * speed * 20; // 20x time compression for visible dynamic feedback
        const tankIdx = currentTanks.findIndex(t => t.id === chargingTankId);
        if (tankIdx !== -1) {
          const t = currentTanks[tankIdx];
          const newStored = Math.min(t.capacityKwh, t.storedEnergyKwh + energyAdded);
          const fill = parseFloat(((newStored / t.capacityKwh) * 100).toFixed(1));
          const temp = Math.round(45 + (fill / 100) * 45);
          currentTanks[tankIdx] = {
            ...t,
            storedEnergyKwh: parseFloat(newStored.toFixed(2)),
            fillPercentage: fill,
            temperatureC: temp,
            status: fill >= 99.8 ? 'FULL' : 'CHARGING'
          };
        }
      }
    }
    this.activeChargingTankId.set(chargingTankId);

    // 2. DISCHARGING STEP (Tanks -> Active Consumers)
    for (let i = 0; i < currentConsumers.length; i++) {
      const c = currentConsumers[i];
      if (c.status !== 'RECEIVING' && c.status !== 'ACTIVE') continue;

      // Find appropriate source tank
      let sourceTank: Tank | undefined;
      if (c.preferredTankId !== 'AUTO') {
        sourceTank = currentTanks.find(t => t.id === c.preferredTankId && t.storedEnergyKwh > 0.5);
      }

      if (!sourceTank && c.autoSource) {
        // Find tank with highest stored energy
        sourceTank = currentTanks
          .filter(t => t.storedEnergyKwh > 0.5)
          .sort((a, b) => b.storedEnergyKwh - a.storedEnergyKwh)[0];
      }

      if (sourceTank) {
        const energyRequired = (c.deliveryRateKw / 3600) * speed * 20;
        const actualDrawn = Math.min(sourceTank.storedEnergyKwh, energyRequired);

        // Deduct from tank
        const tankIdx = currentTanks.findIndex(t => t.id === sourceTank!.id);
        if (tankIdx !== -1) {
          const t = currentTanks[tankIdx];
          const newStored = Math.max(0, t.storedEnergyKwh - actualDrawn);
          const fill = parseFloat(((newStored / t.capacityKwh) * 100).toFixed(1));
          const temp = Math.max(35, Math.round(45 + (fill / 100) * 45));
          currentTanks[tankIdx] = {
            ...t,
            storedEnergyKwh: parseFloat(newStored.toFixed(2)),
            fillPercentage: fill,
            temperatureC: temp,
            status: t.id === chargingTankId ? 'CHARGING' : (fill <= 0.2 ? 'EMPTY' : 'DISCHARGING')
          };
        }

        // Add to consumer
        const newDelivered = c.deliveredEnergyKwh + actualDrawn;
        const isComplete = newDelivered >= c.requiredEnergyKwh;
        const progress = parseFloat(
          Math.min(100, (newDelivered / c.requiredEnergyKwh) * 100).toFixed(1)
        );

        currentConsumers[i] = {
          ...c,
          deliveredEnergyKwh: parseFloat(newDelivered.toFixed(2)),
          progressPercentage: progress,
          activeSourceTankId: isComplete ? null : sourceTank.id,
          status: isComplete ? 'COMPLETED' : 'RECEIVING'
        };
      } else {
        // No energy available
        currentConsumers[i] = {
          ...c,
          activeSourceTankId: null,
          status: 'PAUSED'
        };
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
        if (parsed.priorityOrder) this.priorityOrder.set(parsed.priorityOrder);
        if (parsed.manualSelectedTankId) this.manualSelectedTankId.set(parsed.manualSelectedTankId);
        if (parsed.tanks && Array.isArray(parsed.tanks)) this.tanks.set(parsed.tanks);
        if (parsed.consumers && Array.isArray(parsed.consumers)) this.consumers.set(parsed.consumers);
      }
    } catch (e) {
      console.warn('Failed to load Waste Heat state from localStorage', e);
    }
  }
}
