import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllhistoryFarmComponent } from './allhistory-farm.component';

describe('AllhistoryFarmComponent', () => {
  let component: AllhistoryFarmComponent;
  let fixture: ComponentFixture<AllhistoryFarmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllhistoryFarmComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllhistoryFarmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
