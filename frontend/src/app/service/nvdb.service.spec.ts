import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { NvdbService, AadtResult } from './nvdb.service';

const BASE = 'https://nvdbapiles.atlas.vegvesen.no';
const DELTA = 0.02;

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeObjekt(total: number, heavy = 0, year = 2023, roadName?: string) {
  return {
    egenskaper: [
      { id: 4623, verdi: total },
      { id: 4624, verdi: heavy },
      { id: 4621, verdi: year },
    ],
    lokasjon: roadName ? { adresser: [{ navn: roadName }] } : undefined,
  };
}

describe('NvdbService', () => {
  let service: NvdbService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NvdbService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(service).toBeTruthy());

  // ── getAadt – request construction ────────────────────────────────────────
  describe('getAadt() — request', () => {
    it('sends GET to NVDB vegobjekter/540 endpoint', () => {
      service.getAadt(59.9, 10.7).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/vegobjekter/540'));
      expect(req.request.method).toBe('GET');
      req.flush({ objekter: [] });
    });

    it('includes correct bounding box in URL', () => {
      const lat = 60.0;
      const lon = 11.0;
      service.getAadt(lat, lon).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('kartutsnitt'));
      const url = req.request.url;
      const expectedBbox = `${lon - DELTA},${lat - DELTA},${lon + DELTA},${lat + DELTA}`;
      expect(url).toContain(`kartutsnitt=${expectedBbox}`);
      req.flush({ objekter: [] });
    });

    it('sends X-Client header', () => {
      service.getAadt(59.9, 10.7).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/vegobjekter/540'));
      expect(req.request.headers.get('X-Client')).toBe('snowpole-inspection-app');
      req.flush({ objekter: [] });
    });

    it('includes srid=4326 in URL', () => {
      service.getAadt(59.9, 10.7).subscribe();
      const req = httpMock.expectOne((r) => r.url.includes('/vegobjekter/540'));
      expect(req.request.url).toContain('srid=4326');
      req.flush({ objekter: [] });
    });
  });

  // ── getAadt – response parsing ────────────────────────────────────────────
  describe('getAadt() — response parsing', () => {
    it('returns null when objekter is empty', () => {
      let result: AadtResult | null = { total: 1, heavyVehiclePct: 0, year: 2023, roadName: null };
      service.getAadt(59.9, 10.7).subscribe((r) => (result = r));
      httpMock.expectOne((r) => r.url.includes('/vegobjekter/540')).flush({ objekter: [] });
      expect(result).toBeNull();
    });

    it('returns null when objekter is missing', () => {
      let result: AadtResult | null = { total: 1, heavyVehiclePct: 0, year: 2023, roadName: null };
      service.getAadt(59.9, 10.7).subscribe((r) => (result = r));
      httpMock.expectOne((r) => r.url.includes('/vegobjekter/540')).flush({});
      expect(result).toBeNull();
    });

    it('parses total from property id 4623', () => {
      let result: AadtResult | null = null;
      service.getAadt(59.9, 10.7).subscribe((r) => (result = r));
      httpMock
        .expectOne((r) => r.url.includes('/vegobjekter/540'))
        .flush({ objekter: [makeObjekt(5000)] });
      expect(result?.total).toBe(5000);
    });

    it('parses heavyVehiclePct from property id 4624', () => {
      let result: AadtResult | null = null;
      service.getAadt(59.9, 10.7).subscribe((r) => (result = r));
      httpMock
        .expectOne((r) => r.url.includes('/vegobjekter/540'))
        .flush({ objekter: [makeObjekt(5000, 12)] });
      expect(result?.heavyVehiclePct).toBe(12);
    });

    it('parses year from property id 4621', () => {
      let result: AadtResult | null = null;
      service.getAadt(59.9, 10.7).subscribe((r) => (result = r));
      httpMock
        .expectOne((r) => r.url.includes('/vegobjekter/540'))
        .flush({ objekter: [makeObjekt(5000, 12, 2022)] });
      expect(result?.year).toBe(2022);
    });

    it('parses roadName from lokasjon.adresser[0].navn', () => {
      let result: AadtResult | null = null;
      service.getAadt(59.9, 10.7).subscribe((r) => (result = r));
      httpMock
        .expectOne((r) => r.url.includes('/vegobjekter/540'))
        .flush({ objekter: [makeObjekt(5000, 12, 2022, 'E6')] });
      expect(result?.roadName).toBe('E6');
    });

    it('roadName is null when lokasjon is missing', () => {
      let result: AadtResult | null = null;
      service.getAadt(59.9, 10.7).subscribe((r) => (result = r));
      httpMock
        .expectOne((r) => r.url.includes('/vegobjekter/540'))
        .flush({ objekter: [makeObjekt(5000)] });
      expect(result?.roadName).toBeNull();
    });

    it('picks the objekter with the highest total', () => {
      let result: AadtResult | null = null;
      service.getAadt(59.9, 10.7).subscribe((r) => (result = r));
      httpMock
        .expectOne((r) => r.url.includes('/vegobjekter/540'))
        .flush({
          objekter: [makeObjekt(3000), makeObjekt(8000), makeObjekt(1000)],
        });
      expect(result?.total).toBe(8000);
    });

    it('returns null when no objekter have property id 4623', () => {
      let result: AadtResult | null = { total: 1, heavyVehiclePct: 0, year: 2023, roadName: null };
      service.getAadt(59.9, 10.7).subscribe((r) => (result = r));
      httpMock
        .expectOne((r) => r.url.includes('/vegobjekter/540'))
        .flush({ objekter: [{ egenskaper: [{ id: 9999, verdi: 100 }] }] });
      expect(result).toBeNull();
    });
  });

  // ── getAadt – error handling ───────────────────────────────────────────────
  describe('getAadt() — error handling', () => {
    it('returns null on HTTP error (catchError)', () => {
      let result: AadtResult | null = { total: 1, heavyVehiclePct: 0, year: 2023, roadName: null };
      service.getAadt(59.9, 10.7).subscribe((r) => (result = r));
      httpMock
        .expectOne((r) => r.url.includes('/vegobjekter/540'))
        .flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      expect(result).toBeNull();
    });

    it('does not propagate error to subscriber', () => {
      let errored = false;
      service.getAadt(59.9, 10.7).subscribe({ error: () => (errored = true) });
      httpMock
        .expectOne((r) => r.url.includes('/vegobjekter/540'))
        .flush('Error', { status: 503, statusText: 'Service Unavailable' });
      expect(errored).toBe(false);
    });
  });
});
