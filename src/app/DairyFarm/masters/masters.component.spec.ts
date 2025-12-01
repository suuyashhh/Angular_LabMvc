import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MastersComponent } from './masters.component';

describe('MastersComponent', () => {
  let component: MastersComponent;
  let fixture: ComponentFixture<MastersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MastersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MastersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
