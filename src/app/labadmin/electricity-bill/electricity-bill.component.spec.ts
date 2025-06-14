import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElectricityBillComponent } from './electricity-bill.component';

describe('ElectricityBillComponent', () => {
  let component: ElectricityBillComponent;
  let fixture: ComponentFixture<ElectricityBillComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElectricityBillComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ElectricityBillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
