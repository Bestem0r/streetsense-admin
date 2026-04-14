import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanCaptureRound1Component } from './plan-capture-round.component';

describe('PlanCaptureRound1Component', () => {
  let component: PlanCaptureRound1Component;
  let fixture: ComponentFixture<PlanCaptureRound1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanCaptureRound1Component],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanCaptureRound1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
