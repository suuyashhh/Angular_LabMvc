import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginHeatManagementComponent } from './login-heat-management.component';

describe('LoginHeatManagementComponent', () => {
  let component: LoginHeatManagementComponent;
  let fixture: ComponentFixture<LoginHeatManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginHeatManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoginHeatManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
