import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { PlanCaptureService } from './plan-capture.service';
import { CaptureInterface } from '../interfaces/Capture-interface';
import { environment } from '../../environments/environment';

const BASE = environment.apiUrl + '/captures';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const CAPTURE: CaptureInterface = {
  id: 'c1',
  poles: ['p1', 'p2'],
  startDate: 1710460800000,
  endDate: 1710547200000,
  createdDate: 1710460800000,
};

const NEW_CAPTURE: CaptureInterface = {
  id: '',
  poles: ['p3'],
  startDate: 1710547200000,
  endDate: 1710633600000,
  createdDate: 1710547200000,
};

describe('PlanCaptureService', () => {
  let service: PlanCaptureService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PlanCaptureService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(service).toBeTruthy());

  // ── createCapture ──────────────────────────────────────────────────────────
  describe('createCapture()', () => {
    it('POST /captures with capture body', () => {
      service.createCapture(NEW_CAPTURE).subscribe();
      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(NEW_CAPTURE);
      req.flush(CAPTURE, { status: 201, statusText: 'Created' });
    });

    it('returns the created capture from response body', () => {
      let result: CaptureInterface | undefined;
      service.createCapture(NEW_CAPTURE).subscribe((c) => (result = c));
      httpMock.expectOne(BASE).flush({ ...CAPTURE, id: 'c2' }, { status: 201, statusText: 'Created' });
      expect(result?.id).toBe('c2');
    });

    it('returns null when response body is null', () => {
      let result: CaptureInterface | undefined = CAPTURE;
      service.createCapture(NEW_CAPTURE).subscribe((c) => (result = c));
      httpMock.expectOne(BASE).flush(null, { status: 201, statusText: 'Created' });
      expect(result).toBeNull();
    });
  });

  // ── getCaptures ────────────────────────────────────────────────────────────
  describe('getCaptures()', () => {
    it('GET /captures', () => {
      service.getCaptures().subscribe();
      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('GET');
      req.flush([CAPTURE]);
    });

    it('returns array of captures', () => {
      let result: CaptureInterface[] = [];
      service.getCaptures().subscribe((list) => (result = list));
      httpMock.expectOne(BASE).flush([CAPTURE]);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('c1');
    });

    it('returns empty array when no captures exist', () => {
      let result: CaptureInterface[] = [CAPTURE];
      service.getCaptures().subscribe((list) => (result = list));
      httpMock.expectOne(BASE).flush([]);
      expect(result).toEqual([]);
    });
  });

  // ── getCaptureById ─────────────────────────────────────────────────────────
  describe('getCaptureById()', () => {
    it('GET /captures/:id', () => {
      service.getCaptureById('c1').subscribe();
      const req = httpMock.expectOne(`${BASE}/c1`);
      expect(req.request.method).toBe('GET');
      req.flush(CAPTURE);
    });

    it('returns capture with matching id', () => {
      let result: CaptureInterface | undefined;
      service.getCaptureById('c1').subscribe((c) => (result = c));
      httpMock.expectOne(`${BASE}/c1`).flush(CAPTURE);
      expect(result?.id).toBe('c1');
    });
  });

  // ── getCapturesByDateRange ─────────────────────────────────────────────────
  describe('getCapturesByDateRange()', () => {
    const START = 1710460800000;
    const END = 1710547200000;

    it('GET /captures/dateRange with correct query params', () => {
      service.getCapturesByDateRange(START, END).subscribe();
      const req = httpMock.expectOne(
        `${BASE}/dateRange?startDate=${START}&endDate=${END}`,
      );
      expect(req.request.method).toBe('GET');
      req.flush([CAPTURE]);
    });

    it('returns captures within date range', () => {
      let result: CaptureInterface[] = [];
      service.getCapturesByDateRange(START, END).subscribe((list) => (result = list));
      httpMock
        .expectOne(`${BASE}/dateRange?startDate=${START}&endDate=${END}`)
        .flush([CAPTURE]);
      expect(result.length).toBe(1);
    });
  });

  // ── updateCapture ──────────────────────────────────────────────────────────
  describe('updateCapture()', () => {
    it('PUT /captures/:id with updated capture body', () => {
      const updated = { ...CAPTURE, poles: ['p1', 'p2', 'p3'] };
      service.updateCapture('c1', updated).subscribe();
      const req = httpMock.expectOne(`${BASE}/c1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updated);
      req.flush(updated);
    });

    it('returns the updated capture', () => {
      const updated = { ...CAPTURE, poles: ['p1'] };
      let result: CaptureInterface | undefined;
      service.updateCapture('c1', updated).subscribe((c) => (result = c));
      httpMock.expectOne(`${BASE}/c1`).flush(updated);
      expect(result?.poles).toEqual(['p1']);
    });
  });

  // ── deleteCapture ──────────────────────────────────────────────────────────
  describe('deleteCapture()', () => {
    it('DELETE /captures/:id', () => {
      service.deleteCapture('c1').subscribe();
      const req = httpMock.expectOne(`${BASE}/c1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
