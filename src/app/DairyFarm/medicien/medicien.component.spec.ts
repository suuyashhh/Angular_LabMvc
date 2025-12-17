import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicienComponent } from './medicien.component';

describe('MedicienComponent', () => {
  let component: MedicienComponent;
  let fixture: ComponentFixture<MedicienComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicienComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MedicienComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
