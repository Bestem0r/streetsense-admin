import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { InspectorService, Inspector } from './inspector.service';
import { environment } from '../../environments/environment';

const BASE = environment.apiUrl + '/users';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const BACKEND_USER = {
  id: 'u1',
  userName: 'lars',
  firstName: 'Lars',
  lastName: 'Hansen',
  email: 'lars@example.com',
  phone: '12345678',
  county: 'Oslo',
  role: 'Inspector',
  createdAt: '2024-01-01',
};

const BACKEND_RESPONSE = { success: true, message: 'OK', data: [BACKEND_USER] };

const EXPECTED_INSPECTOR: Inspector = {
  id: 'u1',
  userName: 'lars',
  firstName: 'Lars',
  lastName: 'Hansen',
  email: 'lars@example.com',
  phone: '12345678',
  county: 'Oslo',
  role: 'Inspector',
  createdAt: '2024-01-01',
};

describe('InspectorService', () => {
  let service: InspectorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InspectorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(service).toBeTruthy());

  // ── getInspectors ──────────────────────────────────────────────────────────
  describe('getInspectors()', () => {
    it('GET /users', () => {
      service.getInspectors().subscribe();
      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('GET');
      req.flush(BACKEND_RESPONSE);
    });

    it('maps backend user to Inspector shape', () => {
      let result: Inspector[] = [];
      service.getInspectors().subscribe((list) => (result = list));
      httpMock.expectOne(BASE).flush(BACKEND_RESPONSE);
      expect(result[0]).toEqual(EXPECTED_INSPECTOR);
    });

    it('returns empty array when data is null', () => {
      let result: Inspector[] = [EXPECTED_INSPECTOR];
      service.getInspectors().subscribe((list) => (result = list));
      httpMock.expectOne(BASE).flush({ success: true, message: 'OK', data: null });
      expect(result).toEqual([]);
    });

    it('returns empty array when data is empty', () => {
      let result: Inspector[] = [];
      service.getInspectors().subscribe((list) => (result = list));
      httpMock.expectOne(BASE).flush({ success: true, message: 'OK', data: [] });
      expect(result).toEqual([]);
    });
  });

  // ── getInspectorById ───────────────────────────────────────────────────────
  describe('getInspectorById()', () => {
    it('returns inspector matching id', () => {
      let result: Inspector | undefined;
      service.getInspectorById('u1').subscribe((i) => (result = i));
      httpMock.expectOne(BASE).flush(BACKEND_RESPONSE);
      expect(result?.id).toBe('u1');
    });

    it('returns undefined for unknown id', () => {
      let result: Inspector | undefined = EXPECTED_INSPECTOR;
      service.getInspectorById('unknown').subscribe((i) => (result = i));
      httpMock.expectOne(BASE).flush(BACKEND_RESPONSE);
      expect(result).toBeUndefined();
    });
  });

  // ── searchInspectors ───────────────────────────────────────────────────────
  describe('searchInspectors()', () => {
    it('matches by firstName (case-insensitive)', () => {
      let result: Inspector[] = [];
      service.searchInspectors('lars').subscribe((list) => (result = list));
      httpMock.expectOne(BASE).flush(BACKEND_RESPONSE);
      expect(result.length).toBe(1);
    });

    it('matches by lastName (case-insensitive)', () => {
      let result: Inspector[] = [];
      service.searchInspectors('HANSEN').subscribe((list) => (result = list));
      httpMock.expectOne(BASE).flush(BACKEND_RESPONSE);
      expect(result.length).toBe(1);
    });

    it('matches by email (case-insensitive)', () => {
      let result: Inspector[] = [];
      service.searchInspectors('LARS@EXAMPLE').subscribe((list) => (result = list));
      httpMock.expectOne(BASE).flush(BACKEND_RESPONSE);
      expect(result.length).toBe(1);
    });

    it('returns empty array when no match', () => {
      let result: Inspector[] = [];
      service.searchInspectors('zzznomatch').subscribe((list) => (result = list));
      httpMock.expectOne(BASE).flush(BACKEND_RESPONSE);
      expect(result).toEqual([]);
    });
  });

  // ── addInspector ───────────────────────────────────────────────────────────
  describe('addInspector()', () => {
    const newInspector: Omit<Inspector, 'id'> = {
      firstName: 'Maja',
      lastName: 'Andersen',
      email: 'maja@example.com',
    };

    it('POST to /auth/register', () => {
      service.addInspector(newInspector).subscribe();
      const req = httpMock.expectOne(environment.apiUrl + '/auth/register');
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, message: 'OK', data: { ...BACKEND_USER, id: 'u2' } });
    });

    it('maps response to Inspector shape', () => {
      let result: Inspector | undefined;
      service.addInspector(newInspector).subscribe((i) => (result = i));
      httpMock
        .expectOne(environment.apiUrl + '/auth/register')
        .flush({ success: true, message: 'OK', data: { ...BACKEND_USER, id: 'u2', firstName: 'Maja' } });
      expect(result?.id).toBe('u2');
      expect(result?.firstName).toBe('Maja');
    });
  });

  // ── removeInspector ────────────────────────────────────────────────────────
  describe('removeInspector()', () => {
    it('DELETE /users/:id', () => {
      service.removeInspector('u1').subscribe();
      const req = httpMock.expectOne(`${BASE}/u1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
