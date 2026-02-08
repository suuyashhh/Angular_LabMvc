import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginfarmComponent } from './loginfarm.component';

describe('LoginfarmComponent', () => {
  let component: LoginfarmComponent;
  let fixture: ComponentFixture<LoginfarmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginfarmComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoginfarmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
