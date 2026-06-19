import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParkingSeekerComponent } from './parking-seeker.component';

describe('ParkingSeekerComponent', () => {
  let component: ParkingSeekerComponent;
  let fixture: ComponentFixture<ParkingSeekerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParkingSeekerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ParkingSeekerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
