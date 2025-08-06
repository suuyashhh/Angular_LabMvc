import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-approve-casepaper',
  standalone: true,
  imports: [ HttpClientModule,
      CommonModule,
      ReactiveFormsModule,
      NgxPaginationModule,
      FormsModule,],
  templateUrl: './approve-casepaper.component.html',
  styleUrl: './approve-casepaper.component.css'
})
export class ApproveCasepaperComponent implements OnInit  {
ngOnInit(): void {
    throw new Error('Method not implemented.');
  }
  data = [
    {
      trNo: 1724,
      date: '2025-05-31',
      name: 'Active',
      contact: '1236547890',
      createdBy: 'Atharv',
      status: 'Completed',
      selected: false,
    },
    {
      trNo: 1725,
      date: '2025-05-30',
      name: 'Active',
      contact: '9876543210',
      createdBy: 'Atharv',
      status: 'Completed',
      selected: false,
    },
    {
      trNo: 1725,
      date: '2025-05-30',
      name: 'Active',
      contact: '9876543210',
      createdBy: 'Atharv',
      status: 'Completed',
      selected: false,
    },
    {
      trNo: 1725,
      date: '2025-05-30',
      name: 'Active',
      contact: '9876543210',
      createdBy: 'Atharv',
      status: 'Completed',
      selected: false,
    },
    {
      trNo: 1725,
      date: '2025-05-30',
      name: 'Active',
      contact: '9876543210',
      createdBy: 'Atharv',
      status: 'Completed',
      selected: false,
    },
    {
      trNo: 1725,
      date: '2025-05-30',
      name: 'Active',
      contact: '9876543210',
      createdBy: 'Atharv',
      status: 'Completed',
      selected: false,
    },
    {
      trNo: 1725,
      date: '2025-05-30',
      name: 'Active',
      contact: '9876543210',
      createdBy: 'Atharv',
      status: 'Completed',
      selected: false,
    },
    {
      trNo: 1725,
      date: '2025-05-30',
      name: 'Active',
      contact: '9876543210',
      createdBy: 'Atharv',
      status: 'Completed',
      selected: false,
    },
    // Add more dummy or real data here
  ];

  currentPage = 1;
  rowsPerPage = 5;
  masterSelected: boolean = false;

  toggleAllSelection() {
    this.data.forEach((row) => (row.selected = this.masterSelected));
  }

  checkIfAllSelected() {
    this.masterSelected = this.data.every((row) => row.selected);
  }
}
