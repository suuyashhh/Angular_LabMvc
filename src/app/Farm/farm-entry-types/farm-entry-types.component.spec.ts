import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmEntryTypesComponent } from './farm-entry-types.component';

describe('FarmEntryTypesComponent', () => {
  let component: FarmEntryTypesComponent;
  let fixture: ComponentFixture<FarmEntryTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmEntryTypesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FarmEntryTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
