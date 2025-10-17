import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewmapComponent } from './viewmap.component';

describe('ViewmapComponent', () => {
  let component: ViewmapComponent;
  let fixture: ComponentFixture<ViewmapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewmapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
