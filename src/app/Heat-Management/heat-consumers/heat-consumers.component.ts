import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WasteHeatService, Consumer, Tank } from '../services/waste-heat.service';

type ConsumerFilter = 'ALL' | 'RECEIVING' | 'STANDBY' | 'COMPLETED';

@Component({
  selector: 'app-heat-consumers',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './heat-consumers.component.html',
  styleUrl: './heat-consumers.component.css'
})
export class HeatConsumersComponent {
  public wasteHeat = inject(WasteHeatService);
  private router = inject(Router);

  activeFilter: ConsumerFilter = 'ALL';

  // Modal controls
  showAddEditModal = false;
  isEditing = false;
  editingConsumerId: string | null = null;

  showTelemetryModal = false;
  selectedConsumer: Consumer | null = null;

  showDeleteModal = false;
  consumerToDelete: Consumer | null = null;

  // Form model
  consumerForm: {
    name: string;
    company: string;
    location: string;
    avatar: string;
    requiredEnergyKwh: number;
    deliveryRateKw: number;
    preferredTankId: number | 'AUTO';
    autoSource: boolean;
    contactPerson: string;
    email: string;
    tariff: string;
  } = {
    name: '',
    company: '',
    location: '',
    avatar: '',
    requiredEnergyKwh: 25.0,
    deliveryRateKw: 2.5,
    preferredTankId: 'AUTO',
    autoSource: true,
    contactPerson: '',
    email: '',
    tariff: '$0.075 / kWh'
  };

  formError = '';

  get filteredConsumers(): Consumer[] {
    const list = this.wasteHeat.consumers();
    if (this.activeFilter === 'RECEIVING') {
      return list.filter(c => c.status === 'RECEIVING');
    }
    if (this.activeFilter === 'STANDBY') {
      return list.filter(c => c.status === 'IDLE' || c.status === 'PAUSED');
    }
    if (this.activeFilter === 'COMPLETED') {
      return list.filter(c => c.status === 'COMPLETED');
    }
    return list;
  }

  get receivingCount(): number {
    return this.wasteHeat.consumers().filter(c => c.status === 'RECEIVING').length;
  }

  get standbyCount(): number {
    return this.wasteHeat.consumers().filter(c => c.status === 'IDLE' || c.status === 'PAUSED').length;
  }

  get completedCount(): number {
    return this.wasteHeat.consumers().filter(c => c.status === 'COMPLETED').length;
  }

  getTank(id: number | null): Tank | undefined {
    if (!id) return undefined;
    return this.wasteHeat.tanks().find(t => t.id === id);
  }

  getTankName(id: number | null | 'AUTO'): string {
    if (id === 'AUTO' || !id) return 'Auto-Select';
    const t = this.getTank(id);
    return t ? t.name : `Tank 0${id}`;
  }

  getTankAvailable(id: number | null | 'AUTO'): string {
    if (id === 'AUTO' || !id) {
      return `${this.wasteHeat.totalStoredKwh()} kWh across matrix`;
    }
    const t = this.getTank(id);
    return t ? `${t.storedEnergyKwh} kWh available` : '0 kWh';
  }

  toggleSupply(c: Consumer): void {
    this.wasteHeat.toggleSupply(c.id);
  }

  setDeliveryRate(c: Consumer, rate: number): void {
    this.wasteHeat.setConsumerDeliveryRate(c.id, rate);
  }

  toggleAutoSource(c: Consumer): void {
    this.wasteHeat.toggleConsumerAutoSource(c.id);
  }

  // --- Add / Edit Modal ---
  openAddModal(): void {
    this.isEditing = false;
    this.editingConsumerId = null;
    this.formError = '';
    this.consumerForm = {
      name: '',
      company: '',
      location: '',
      avatar: '',
      requiredEnergyKwh: 20.0,
      deliveryRateKw: 2.5,
      preferredTankId: 'AUTO',
      autoSource: true,
      contactPerson: '',
      email: '',
      tariff: '$0.075 / kWh'
    };
    this.showAddEditModal = true;
  }

  openEditModal(c: Consumer): void {
    this.isEditing = true;
    this.editingConsumerId = c.id;
    this.formError = '';
    this.consumerForm = {
      name: c.name,
      company: c.company,
      location: c.location,
      avatar: c.avatar,
      requiredEnergyKwh: c.requiredEnergyKwh,
      deliveryRateKw: c.deliveryRateKw,
      preferredTankId: c.preferredTankId,
      autoSource: c.autoSource,
      contactPerson: c.contactPerson || '',
      email: c.email || '',
      tariff: c.tariff || '$0.075 / kWh'
    };
    this.showAddEditModal = true;
  }

  saveConsumer(): void {
    if (!this.consumerForm.name.trim()) {
      this.formError = 'Consumer facility name is required.';
      return;
    }
    if (!this.consumerForm.company.trim()) {
      this.formError = 'Operating company name is required.';
      return;
    }
    if (this.consumerForm.requiredEnergyKwh <= 0) {
      this.formError = 'Target thermal demand must be greater than 0 kWh.';
      return;
    }

    if (this.isEditing && this.editingConsumerId) {
      this.wasteHeat.updateConsumer(this.editingConsumerId, {
        name: this.consumerForm.name,
        company: this.consumerForm.company,
        location: this.consumerForm.location,
        requiredEnergyKwh: Number(this.consumerForm.requiredEnergyKwh),
        deliveryRateKw: Number(this.consumerForm.deliveryRateKw),
        preferredTankId: this.consumerForm.preferredTankId,
        autoSource: this.consumerForm.autoSource,
        contactPerson: this.consumerForm.contactPerson,
        email: this.consumerForm.email,
        tariff: this.consumerForm.tariff
      });
    } else {
      this.wasteHeat.addConsumer(this.consumerForm);
    }

    this.showAddEditModal = false;
  }

  closeAddEditModal(): void {
    this.showAddEditModal = false;
  }

  // --- Telemetry Modal ---
  openTelemetryModal(c: Consumer): void {
    this.selectedConsumer = c;
    this.showTelemetryModal = true;
  }

  closeTelemetryModal(): void {
    this.showTelemetryModal = false;
    this.selectedConsumer = null;
  }

  // --- Delete Modal ---
  openDeleteModal(c: Consumer): void {
    this.consumerToDelete = c;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.consumerToDelete) {
      this.wasteHeat.deleteConsumer(this.consumerToDelete.id);
      this.consumerToDelete = null;
    }
    this.showDeleteModal = false;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.consumerToDelete = null;
  }

  navigate(route: string): void {
    this.router.navigate([`/heatmanagement/${route}`]);
  }
}
