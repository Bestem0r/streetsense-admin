import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { InspectorsComponent } from './inspectors.component';

describe('InspectorsComponent', () => {
  let component: InspectorsComponent;
  let fixture: ComponentFixture<InspectorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InspectorsComponent],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(InspectorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
