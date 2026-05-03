import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { PlanCaptureRoundComponent } from './plan-capture-round.component';

describe('PlanCaptureRoundComponent', () => {
  let component: PlanCaptureRoundComponent;
  let fixture: ComponentFixture<PlanCaptureRoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanCaptureRoundComponent],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanCaptureRoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
