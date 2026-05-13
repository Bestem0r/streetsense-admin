import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  describe('default inputs', () => {
    it('has empty title and message', () => {
      expect(component.title).toBe('');
      expect(component.message).toBe('');
    });

    it('has confirmLabel = Confirm', () => {
      expect(component.confirmLabel).toBe('Confirm');
    });

    it('has danger = true', () => {
      expect(component.danger).toBe(true);
    });
  });

  describe('inputs', () => {
    it('accepts custom title, message, confirmLabel, danger', () => {
      component.title = 'Delete pole?';
      component.message = 'This cannot be undone.';
      component.confirmLabel = 'Delete';
      component.danger = false;
      fixture.detectChanges();
      expect(component.title).toBe('Delete pole?');
      expect(component.message).toBe('This cannot be undone.');
      expect(component.confirmLabel).toBe('Delete');
      expect(component.danger).toBe(false);
    });
  });

  describe('outputs', () => {
    it('emits confirmed when confirmed output fires', () => {
      const spy = vi.fn();
      component.confirmed.subscribe(spy);
      component.confirmed.emit();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('emits cancelled when cancelled output fires', () => {
      const spy = vi.fn();
      component.cancelled.subscribe(spy);
      component.cancelled.emit();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('confirmed and cancelled are independent', () => {
      const confirmedSpy = vi.fn();
      const cancelledSpy = vi.fn();
      component.confirmed.subscribe(confirmedSpy);
      component.cancelled.subscribe(cancelledSpy);
      component.confirmed.emit();
      expect(confirmedSpy).toHaveBeenCalledTimes(1);
      expect(cancelledSpy).not.toHaveBeenCalled();
    });
  });
});
