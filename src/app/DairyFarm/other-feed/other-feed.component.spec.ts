import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtherFeedComponent } from './other-feed.component';

describe('OtherFeedComponent', () => {
  let component: OtherFeedComponent;
  let fixture: ComponentFixture<OtherFeedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtherFeedComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OtherFeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
