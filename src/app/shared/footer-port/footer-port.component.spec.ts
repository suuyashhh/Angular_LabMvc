import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterPortComponent } from './footer-port.component';

describe('FooterPortComponent', () => {
  let component: FooterPortComponent;
  let fixture: ComponentFixture<FooterPortComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterPortComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FooterPortComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
