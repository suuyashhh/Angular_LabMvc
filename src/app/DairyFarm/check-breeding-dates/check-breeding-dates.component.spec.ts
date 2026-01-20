import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckBreedingDatesComponent } from './check-breeding-dates.component';

describe('CheckBreedingDatesComponent', () => {
  let component: CheckBreedingDatesComponent;
  let fixture: ComponentFixture<CheckBreedingDatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckBreedingDatesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CheckBreedingDatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
