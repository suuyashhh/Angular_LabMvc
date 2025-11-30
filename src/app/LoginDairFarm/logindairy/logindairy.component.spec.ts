import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogindairyComponent } from './logindairy.component';

describe('LogindairyComponent', () => {
  let component: LogindairyComponent;
  let fixture: ComponentFixture<LogindairyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogindairyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LogindairyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
