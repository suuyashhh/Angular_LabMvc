import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BikeFuleComponent } from './bike-fule.component';

describe('BikeFuleComponent', () => {
  let component: BikeFuleComponent;
  let fixture: ComponentFixture<BikeFuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BikeFuleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BikeFuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
