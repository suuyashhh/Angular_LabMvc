import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { Modal } from 'bootstrap';
import { ApiService } from '../../../shared/api.service';

@Component({
  selector: 'app-casepaper',
  standalone: true,
  imports: [
    HttpClientModule,
    CommonModule,
    ReactiveFormsModule,
    NgxPaginationModule,
    FormsModule,
  ],
  templateUrl: './casepaper.component.html',
  styleUrl: './casepaper.component.css',
})
export class CasepaperComponent implements OnInit {

  cases:any;
  data:any = [];
  approve_list:any = [];
  constructor(private api:ApiService){}

  ngOnInit(): void {
    this.load();
  }


  // currentPage = 1;
  // rowsPerPage = 5;
  // masterSelected: boolean = false;

  // toggleAllSelection() {
  //   this.data.forEach((ro) => (row.selected = this.masterSelected));
  // }

  // checkIfAllSelected() {
  //   this.masterSelected = this.data.every((row) => row.selected);
  // }

  load() {
    this.api.get('CasePaper/CasePapers').subscribe((res: any) => {
      this.data = res.filter((item:any) => item.statuS_CODE === 0);
      console.log(this.data);
    });
  }
}
