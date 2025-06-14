import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtherExpenseComponent } from './other-expense.component';

describe('OtherExpenseComponent', () => {
  let component: OtherExpenseComponent;
  let fixture: ComponentFixture<OtherExpenseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtherExpenseComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OtherExpenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
