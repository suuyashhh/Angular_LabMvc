import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmentryComponent } from './farmentry.component';

describe('FarmentryComponent', () => {
  let component: FarmentryComponent;
  let fixture: ComponentFixture<FarmentryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmentryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FarmentryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
