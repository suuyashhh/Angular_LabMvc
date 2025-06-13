import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeSalaryComponent } from './employee-salary.component';

describe('EmployeeSalaryComponent', () => {
  let component: EmployeeSalaryComponent;
  let fixture: ComponentFixture<EmployeeSalaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeSalaryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmployeeSalaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
