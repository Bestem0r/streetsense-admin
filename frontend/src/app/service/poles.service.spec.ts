import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { PolesService } from './poles.service';
import { PoleInterface } from '../interfaces/pole-interface';
import { environment } from '../../environments/environment';

const BASE = environment.apiUrl + '/poles';

const POLE: PoleInterface = {
  id: 'p1',
  county: 'Oslo',
  municipality: 'Oslo',
  capturedDate: '2024-03-15',
  images: [{ imageId: 'img1', capturedDate: 1710460800000, inspectionStatus: 'Inspected' }],
};

const PAGED = {
  content: [POLE],
  page: 0,
  size: 10,
  totalElements: 1,
  hasMore: false,
};

describe('PolesService', () => {
  let service: PolesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PolesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(service).toBeTruthy());

  // ── getPoles ───────────────────────────────────────────────────────────────
  describe('getPoles()', () => {
    it('GET /poles', () => {
      service.getPoles().subscribe();
      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('GET');
      req.flush([POLE]);
    });

    it('returns array of poles', () => {
      let result: PoleInterface[] = [];
      service.getPoles().subscribe((p) => (result = p));
      httpMock.expectOne(BASE).flush([POLE]);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('p1');
    });
  });

  // ── getPolesByDate ─────────────────────────────────────────────────────────
  describe('getPolesByDate()', () => {
    it('includes date, page and size query params', () => {
      service.getPolesByDate('2024-03-15').subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/date'));
      expect(req.request.params.get('date')).toBe('2024-03-15');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('10');
      req.flush(PAGED);
    });

    it('includes counties param when provided', () => {
      service.getPolesByDate('2024-03-15', ['Oslo', 'Viken']).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/date'));
      expect(req.request.params.get('counties')).toBe('Oslo,Viken');
      req.flush(PAGED);
    });

    it('includes municipalities param when provided', () => {
      service.getPolesByDate('2024-03-15', [], ['Lillestrøm']).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/date'));
      expect(req.request.params.get('municipalities')).toBe('Lillestrøm');
      req.flush(PAGED);
    });

    it('omits counties param when array is empty', () => {
      service.getPolesByDate('2024-03-15', []).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/date'));
      expect(req.request.params.has('counties')).toBe(false);
      req.flush(PAGED);
    });

    it('omits municipalities param when array is empty', () => {
      service.getPolesByDate('2024-03-15', [], []).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/date'));
      expect(req.request.params.has('municipalities')).toBe(false);
      req.flush(PAGED);
    });

    it('respects custom page and size', () => {
      service.getPolesByDate('2024-03-15', [], [], 2, 25).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/date'));
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('size')).toBe('25');
      req.flush(PAGED);
    });
  });

  // ── getSummary ─────────────────────────────────────────────────────────────
  describe('getSummary()', () => {
    it('GET /poles/summary with no params', () => {
      service.getSummary().subscribe();
      const req = httpMock.expectOne(`${BASE}/summary`);
      expect(req.request.method).toBe('GET');
      req.flush({ totalPoles: 10 });
    });

    it('includes counties and municipalities when provided', () => {
      service.getSummary(['Oslo'], ['Bærum']).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/summary'));
      expect(req.request.params.get('counties')).toBe('Oslo');
      expect(req.request.params.get('municipalities')).toBe('Bærum');
      req.flush({});
    });
  });

  // ── getCapturedDates ───────────────────────────────────────────────────────
  describe('getCapturedDates()', () => {
    it('GET /poles/capturedDates', () => {
      service.getCapturedDates().subscribe();
      const req = httpMock.expectOne(`${BASE}/capturedDates`);
      expect(req.request.method).toBe('GET');
      req.flush(['2024-03-15', '2024-03-16']);
    });
  });

  // ── getPoleById ────────────────────────────────────────────────────────────
  describe('getPoleById()', () => {
    it('GET /poles/id/:id', () => {
      service.getPoleById('p1').subscribe();
      const req = httpMock.expectOne(`${BASE}/id/p1`);
      expect(req.request.method).toBe('GET');
      req.flush(POLE);
    });

    it('returns the pole with matching id', () => {
      let result: PoleInterface | undefined;
      service.getPoleById('p1').subscribe((p) => (result = p));
      httpMock.expectOne(`${BASE}/id/p1`).flush(POLE);
      expect(result?.id).toBe('p1');
    });
  });

  // ── getPolesByInspector ────────────────────────────────────────────────────
  describe('getPolesByInspector()', () => {
    it('GET /poles/inspector/:id', () => {
      service.getPolesByInspector('insp-1').subscribe();
      const req = httpMock.expectOne(`${BASE}/inspector/insp-1`);
      expect(req.request.method).toBe('GET');
      req.flush([POLE]);
    });
  });

  // ── getInspectorStats ──────────────────────────────────────────────────────
  describe('getInspectorStats()', () => {
    it('GET /poles/inspector/:id/stats', () => {
      service.getInspectorStats('insp-1').subscribe();
      const req = httpMock.expectOne(`${BASE}/inspector/insp-1/stats`);
      expect(req.request.method).toBe('GET');
      req.flush({ totalAssigned: 5, inspectedCount: 3, byAction: [], byCounty: [], byMunicipality: [], recentActivity: [] });
    });
  });

  // ── getDashboardStats ──────────────────────────────────────────────────────
  describe('getDashboardStats()', () => {
    it('GET /poles/dashboard-stats', () => {
      service.getDashboardStats().subscribe();
      const req = httpMock.expectOne(`${BASE}/dashboard-stats`);
      expect(req.request.method).toBe('GET');
      req.flush({ totalPoles: 100, inspectedCount: 75, captureDates: [], byCounty: [], byInspector: [], recentInspections: [] });
    });
  });

  // ── updatePole ─────────────────────────────────────────────────────────────
  describe('updatePole()', () => {
    it('PUT /poles/:id with pole body', () => {
      service.updatePole(POLE).subscribe();
      const req = httpMock.expectOne(`${BASE}/p1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(POLE);
      req.flush(POLE, { status: 200, statusText: 'OK' });
    });

    it('returns full HttpResponse', () => {
      let statusCode = 0;
      service.updatePole(POLE).subscribe((res) => (statusCode = res.status!));
      httpMock.expectOne(`${BASE}/p1`).flush(POLE, { status: 200, statusText: 'OK' });
      expect(statusCode).toBe(200);
    });
  });
});
