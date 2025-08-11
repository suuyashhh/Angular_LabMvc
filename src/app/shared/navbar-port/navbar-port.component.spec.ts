import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarPortComponent } from './navbar-port.component';

describe('NavbarPortComponent', () => {
  let component: NavbarPortComponent;
  let fixture: ComponentFixture<NavbarPortComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarPortComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NavbarPortComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
