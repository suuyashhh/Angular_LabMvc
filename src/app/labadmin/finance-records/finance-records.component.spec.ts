import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinanceRecordsComponent } from './finance-records.component';

describe('FinanceRecordsComponent', () => {
  let component: FinanceRecordsComponent;
  let fixture: ComponentFixture<FinanceRecordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinanceRecordsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FinanceRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
