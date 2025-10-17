import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MypetmanagementComponent } from './mypetmanagement.component';

describe('MypetmanagementComponent', () => {
  let component: MypetmanagementComponent;
  let fixture: ComponentFixture<MypetmanagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MypetmanagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MypetmanagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
