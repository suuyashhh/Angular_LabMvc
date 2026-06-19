import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParkingProviderComponent } from './parking-provider.component';

describe('ParkingProviderComponent', () => {
  let component: ParkingProviderComponent;
  let fixture: ComponentFixture<ParkingProviderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParkingProviderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ParkingProviderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
