import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyPeComponent } from './monthly-pe.component';

describe('MonthlyPeComponent', () => {
  let component: MonthlyPeComponent;
  let fixture: ComponentFixture<MonthlyPeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyPeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MonthlyPeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
