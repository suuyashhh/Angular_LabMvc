import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorCommissionComponent } from './doctor-commission.component';

describe('DoctorCommissionComponent', () => {
  let component: DoctorCommissionComponent;
  let fixture: ComponentFixture<DoctorCommissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorCommissionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DoctorCommissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
