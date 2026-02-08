import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowentryComponent } from './showentry.component';

describe('ShowentryComponent', () => {
  let component: ShowentryComponent;
  let fixture: ComponentFixture<ShowentryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowentryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShowentryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
