import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatePeComponent } from './date-pe.component';

describe('DatePeComponent', () => {
  let component: DatePeComponent;
  let fixture: ComponentFixture<DatePeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DatePeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
