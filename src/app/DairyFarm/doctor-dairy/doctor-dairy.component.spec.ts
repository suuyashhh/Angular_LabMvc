import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorDairyComponent } from './doctor-dairy.component';

describe('DoctorDairyComponent', () => {
  let component: DoctorDairyComponent;
  let fixture: ComponentFixture<DoctorDairyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorDairyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DoctorDairyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
