import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmreportComponent } from './farmreport.component';

describe('FarmreportComponent', () => {
  let component: FarmreportComponent;
  let fixture: ComponentFixture<FarmreportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmreportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FarmreportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
