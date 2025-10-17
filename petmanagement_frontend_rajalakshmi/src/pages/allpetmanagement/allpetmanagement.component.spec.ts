import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllpetmanagementComponent } from './allpetmanagement.component';

describe('AllpetmanagementComponent', () => {
  let component: AllpetmanagementComponent;
  let fixture: ComponentFixture<AllpetmanagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllpetmanagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllpetmanagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
