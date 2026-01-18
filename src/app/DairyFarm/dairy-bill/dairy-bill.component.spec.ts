import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DairyBillComponent } from './dairy-bill.component';

describe('DairyBillComponent', () => {
  let component: DairyBillComponent;
  let fixture: ComponentFixture<DairyBillComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DairyBillComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DairyBillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
