import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabMaterialsComponent } from './lab-materials.component';

describe('LabMaterialsComponent', () => {
  let component: LabMaterialsComponent;
  let fixture: ComponentFixture<LabMaterialsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabMaterialsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LabMaterialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
