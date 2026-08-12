import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectMasterComponent } from './project-master.component';

describe('ProjectMasterComponent', () => {
  let component: ProjectMasterComponent;
  let fixture: ComponentFixture<ProjectMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectMasterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjectMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
