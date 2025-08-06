import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveCasepaperComponent } from './approve-casepaper.component';

describe('ApproveCasepaperComponent', () => {
  let component: ApproveCasepaperComponent;
  let fixture: ComponentFixture<ApproveCasepaperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApproveCasepaperComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ApproveCasepaperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
