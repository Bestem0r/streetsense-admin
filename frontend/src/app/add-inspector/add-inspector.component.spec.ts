import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AddInspectorComponent } from './add-inspector.component';
import { AuthService } from '../service/auth.service';
import { InspectorService } from '../service/inspector.service';

const mockAuthService = {
  register: vi.fn(),
};

const mockInspectorService = {};

const validFormValue = {
  firstName: 'Kari',
  lastName: 'Nordmann',
  email: 'kari@example.com',
  phone: '+47 123 45 678',
  userName: 'karinordmann',
  password: 'secret123',
  confirmPassword: 'secret123',
  county: 'Viken',
  role: 'Field Inspector',
  status: 'Active',
};

describe('AddInspectorComponent', () => {
  let component: AddInspectorComponent;
  let fixture: ComponentFixture<AddInspectorComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [AddInspectorComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: InspectorService, useValue: mockInspectorService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddInspectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('firstNameInitial', () => {
    it('returns empty string when both fields are empty', () => {
      component.form.patchValue({ firstName: '', lastName: '' });
      expect(component.firstNameInitial).toBe('');
    });

    it('returns both initials uppercased when both fields have values', () => {
      component.form.patchValue({ firstName: 'kari', lastName: 'nordmann' });
      expect(component.firstNameInitial).toBe('KN');
    });

    it('returns only first initial when lastName is empty', () => {
      component.form.patchValue({ firstName: 'kari', lastName: '' });
      expect(component.firstNameInitial).toBe('K');
    });

    it('returns only last initial when firstName is empty', () => {
      component.form.patchValue({ firstName: '', lastName: 'nordmann' });
      expect(component.firstNameInitial).toBe('N');
    });

    it('trims whitespace before extracting initials', () => {
      component.form.patchValue({
        firstName: '  kari  ',
        lastName: '  nordmann  ',
      });
      expect(component.firstNameInitial).toBe('KN');
    });
  });

  describe('onSubmit() — invalid form', () => {
    it('sets submitted to true', () => {
      expect(component.submitted).toBe(false);
      component.onSubmit();
      expect(component.submitted).toBe(true);
    });
  });

  describe('onSubmit() — password mismatch', () => {
    beforeEach(() => {
      component.form.setValue({
        ...validFormValue,
        password: 'secret123',
        confirmPassword: 'different',
      });
    });

    it('sets errorMessage to passwords do not match', () => {
      component.onSubmit();
      expect(component.errorMessage).toBe('Passwords do not match');
    });
  });

  describe('onSubmit() — successful registration', () => {
    const successResponse = { success: true };

    beforeEach(() => {
      component.form.setValue(validFormValue);
    });

    it('calls authService.register with the correct payload', () => {
      mockAuthService.register.mockReturnValue(of(successResponse));
      component.onSubmit();
      expect(mockAuthService.register).toHaveBeenCalledWith({
        userName: 'karinordmann',
        email: 'kari@example.com',
        firstName: 'Kari',
        lastName: 'Nordmann',
        password: 'secret123',
        confirmPassword: 'secret123',
        phoneNumber: '+47 123 45 678',
      });
    });

    it('does not emit inspectorAdded when response.success is false', () => {
      mockAuthService.register.mockReturnValue(of({ success: false }));
      const emitSpy = vi.spyOn(component.inspectorAdded, 'emit');
      component.onSubmit();
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('onSubmit() — registration error', () => {
    beforeEach(() => {
      component.form.setValue(validFormValue);
    });

    it('shows error.error.message from server', () => {
      mockAuthService.register.mockReturnValue(
        throwError(() => ({ error: { message: 'Username already taken' } })),
      );
      component.onSubmit();
      expect(component.errorMessage).toBe('Username already taken');
    });

    it('shows nested error.error.error.message as fallback', () => {
      mockAuthService.register.mockReturnValue(
        throwError(() => ({ error: { error: { message: 'Conflict' } } })),
      );
      component.onSubmit();
      expect(component.errorMessage).toBe('Conflict');
    });

    it('shows default message when server provides no message', () => {
      mockAuthService.register.mockReturnValue(
        throwError(() => ({ error: {} })),
      );
      component.onSubmit();
      expect(component.errorMessage).toBe(
        'Failed to register inspector. Please try again.',
      );
    });

    it('sets isLoading to false on error', () => {
      mockAuthService.register.mockReturnValue(
        throwError(() => ({ error: {} })),
      );
      component.onSubmit();
      expect(component.isLoading).toBe(false);
    });

    it('does not emit inspectorAdded on error', () => {
      mockAuthService.register.mockReturnValue(
        throwError(() => ({ error: {} })),
      );
      const emitSpy = vi.spyOn(component.inspectorAdded, 'emit');
      component.onSubmit();
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('onCancel()', () => {
    it('resets all form controls to null', () => {
      component.form.patchValue({ firstName: 'Kari', userName: 'kari' });
      component.onCancel();
      expect(component.form.get('firstName')?.value).toBeNull();
      expect(component.form.get('userName')?.value).toBeNull();
    });

    it('resets submitted to false', () => {
      component.submitted = true;
      component.onCancel();
      expect(component.submitted).toBe(false);
    });

    it('emits cancelForm', () => {
      const emitSpy = vi.spyOn(component.cancelForm, 'emit');
      component.onCancel();
      expect(emitSpy).toHaveBeenCalled();
    });
  });
});
