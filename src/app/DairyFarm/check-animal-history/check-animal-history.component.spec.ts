import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckAnimalHistoryComponent } from './check-animal-history.component';

describe('CheckAnimalHistoryComponent', () => {
  let component: CheckAnimalHistoryComponent;
  let fixture: ComponentFixture<CheckAnimalHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckAnimalHistoryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CheckAnimalHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
