import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryDairyComponent } from './history-dairy.component';

describe('HistoryDairyComponent', () => {
  let component: HistoryDairyComponent;
  let fixture: ComponentFixture<HistoryDairyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryDairyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HistoryDairyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
