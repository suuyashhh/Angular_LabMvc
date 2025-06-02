import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CasepaperComponent } from './casepaper.component';

describe('CasepaperComponent', () => {
  let component: CasepaperComponent;
  let fixture: ComponentFixture<CasepaperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasepaperComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CasepaperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
