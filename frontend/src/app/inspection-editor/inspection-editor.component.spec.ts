import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { InspectionEditorComponent } from './inspection-editor.component';

describe('InspectionEditorComponent', () => {
  let component: InspectionEditorComponent;
  let fixture: ComponentFixture<InspectionEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InspectionEditorComponent],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(InspectionEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
