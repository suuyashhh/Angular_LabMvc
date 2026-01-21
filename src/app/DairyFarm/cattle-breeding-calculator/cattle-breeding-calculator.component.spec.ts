import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CattleBreedingCalculatorComponent } from './cattle-breeding-calculator.component';

describe('CattleBreedingCalculatorComponent', () => {
  let component: CattleBreedingCalculatorComponent;
  let fixture: ComponentFixture<CattleBreedingCalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CattleBreedingCalculatorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CattleBreedingCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
