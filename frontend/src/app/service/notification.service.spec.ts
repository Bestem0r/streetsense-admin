import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { NotificationService } from './notification.service';
import { Notification } from '../interfaces/notification-interface';
import { environment } from '../../environments/environment';

const BASE = environment.apiUrl + '/notifications';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const N1: Notification = {
  id: 'n1', type: 'capture', poleIds: ['p1'], severity: 'info',
  createdDate: 1710460800000, polesCount: 1, read: false,
};
const N2: Notification = {
  id: 'n2', type: 'overdue', poleIds: ['p2'], severity: 'warning',
  createdDate: 1710547200000, polesCount: 1, read: true,
};

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(service).toBeTruthy());

  // ── notifications$ initial state ───────────────────────────────────────────
  describe('notifications$ initial state', () => {
    it('starts as empty array', () => {
      let value: Notification[] = [N1];
      service.notifications$.subscribe((n) => (value = n));
      expect(value).toEqual([]);
    });
  });

  // ── getNotifications ───────────────────────────────────────────────────────
  describe('getNotifications()', () => {
    it('GET /notifications', () => {
      service.getNotifications().subscribe();
      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('GET');
      req.flush([N1, N2]);
    });

    it('returns array of notifications', () => {
      let result: Notification[] = [];
      service.getNotifications().subscribe((n) => (result = n));
      httpMock.expectOne(BASE).flush([N1, N2]);
      expect(result.length).toBe(2);
    });
  });

  // ── loadNotifications ──────────────────────────────────────────────────────
  describe('loadNotifications()', () => {
    it('updates notifications$ with provided array', () => {
      let emitted: Notification[] = [];
      service.notifications$.subscribe((n) => (emitted = n));
      service.loadNotifications([N1, N2]);
      expect(emitted).toEqual([N1, N2]);
    });

    it('replaces previous value entirely', () => {
      service.loadNotifications([N1, N2]);
      service.loadNotifications([N2]);
      let emitted: Notification[] = [];
      service.notifications$.subscribe((n) => (emitted = n));
      expect(emitted).toEqual([N2]);
    });
  });

  // ── refresh ────────────────────────────────────────────────────────────────
  describe('refresh()', () => {
    it('GET /notifications and updates notifications$', () => {
      let emitted: Notification[] = [];
      service.notifications$.subscribe((n) => (emitted = n));

      service.refresh();
      httpMock.expectOne(BASE).flush([N1]);

      expect(emitted).toEqual([N1]);
    });
  });

  // ── markAsRead ─────────────────────────────────────────────────────────────
  describe('markAsRead()', () => {
    it('PUT /notifications/:id/mark-as-read', () => {
      service.loadNotifications([N1]);
      service.markAsRead('n1');
      const req = httpMock.expectOne(`${BASE}/n1/mark-as-read`);
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });

    it('sets read=true on the matching notification in notifications$', () => {
      service.loadNotifications([N1]);
      let emitted: Notification[] = [];
      service.notifications$.subscribe((n) => (emitted = n));

      service.markAsRead('n1');
      httpMock.expectOne(`${BASE}/n1/mark-as-read`).flush({});

      expect(emitted.find((n) => n.id === 'n1')?.read).toBe(true);
    });

    it('does not affect other notifications', () => {
      service.loadNotifications([N1, N2]);
      let emitted: Notification[] = [];
      service.notifications$.subscribe((n) => (emitted = n));

      service.markAsRead('n1');
      httpMock.expectOne(`${BASE}/n1/mark-as-read`).flush({});

      expect(emitted.find((n) => n.id === 'n2')?.read).toBe(true);
    });
  });

  // ── clearNotification ──────────────────────────────────────────────────────
  describe('clearNotification()', () => {
    it('DELETE /notifications/:id', () => {
      service.loadNotifications([N1, N2]);
      service.clearNotification('n1');
      const req = httpMock.expectOne(`${BASE}/n1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('removes matching notification from notifications$', () => {
      service.loadNotifications([N1, N2]);
      let emitted: Notification[] = [];
      service.notifications$.subscribe((n) => (emitted = n));

      service.clearNotification('n1');
      httpMock.expectOne(`${BASE}/n1`).flush(null);

      expect(emitted.find((n) => n.id === 'n1')).toBeUndefined();
      expect(emitted.length).toBe(1);
    });
  });

  // ── clearAllRead ───────────────────────────────────────────────────────────
  describe('clearAllRead()', () => {
    it('POST /notifications/clear-read', () => {
      service.clearAllRead();
      const req = httpMock.expectOne(`${BASE}/clear-read`);
      expect(req.request.method).toBe('POST');
      req.flush({});
    });

    it('removes all read notifications from notifications$', () => {
      service.loadNotifications([N1, N2]); // N1 unread, N2 read
      let emitted: Notification[] = [];
      service.notifications$.subscribe((n) => (emitted = n));

      service.clearAllRead();
      httpMock.expectOne(`${BASE}/clear-read`).flush({});

      expect(emitted.every((n) => !n.read)).toBe(true);
      expect(emitted.length).toBe(1);
      expect(emitted[0].id).toBe('n1');
    });

    it('keeps unread notifications intact', () => {
      service.loadNotifications([N1]);
      let emitted: Notification[] = [];
      service.notifications$.subscribe((n) => (emitted = n));

      service.clearAllRead();
      httpMock.expectOne(`${BASE}/clear-read`).flush({});

      expect(emitted.length).toBe(1);
    });
  });
});
