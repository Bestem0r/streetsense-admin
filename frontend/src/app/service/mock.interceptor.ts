import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

// Toggle this to false to hit the real backend instead.
const MOCK_ACTIVE = false;

@Injectable()
export class MockInterceptor implements HttpInterceptor {
  private get fakeToken(): string {
    const b64 = (o: object) =>
      btoa(JSON.stringify(o))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    return [
      b64({ alg: 'HS256', typ: 'JWT' }),
      b64({ sub: '1', userName: 'admin', iat: 1718582400, exp: 9999999999 }),
      'mock',
    ].join('.');
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    if (!MOCK_ACTIVE || !req.url.includes(':9091')) return next.handle(req);
    let parsed: URL;
    try {
      parsed = new URL(req.url);
    } catch {
      return next.handle(req);
    }
    const path = parsed.pathname.replace(/^\/api/, '');
    return of(this.route(req.method, path, parsed.searchParams, req)).pipe(
      delay(130),
    );
  }

  private route(
    method: string,
    path: string,
    params: URLSearchParams,
    req: HttpRequest<any>,
  ): HttpResponse<any> {
    const ok = (body: any) => new HttpResponse({ status: 200, body });

    // AUTH
    if (['/auth/login', '/auth/refresh-token'].includes(path))
      return ok(this.authResp());
    if (path === '/auth/register') {
      // inspector add (no password field) vs user self-register (has password)
      const hasPassword = req.body && 'password' in req.body;
      if (hasPassword) return ok(this.authResp());
      const newInspector = { id: `insp-${Date.now()}`, ...req.body };
      return ok({ success: true, message: 'OK', data: newInspector });
    }
    if (path === '/auth/me' || path === '/auth/profile') return ok(MOCK_USER);
    if (path.startsWith('/auth/')) return ok({ success: true, message: 'OK' });

    // POLES — exact paths first, then parameterised patterns
    if (method === 'GET' && path === '/poles') return ok(MOCK_POLES);
    if (method === 'GET' && path === '/poles/dashboard-stats')
      return ok(MOCK_DASHBOARD_STATS);
    if (method === 'GET' && path === '/poles/summary') return ok(MOCK_SUMMARY);
    if (method === 'GET' && path === '/poles/capturedDates')
      return ok(MOCK_CAPTURED_DATES);

    if (method === 'GET' && path === '/poles/date') {
      const date = params.get('date');
      const page = +(params.get('page') ?? 0);
      const size = +(params.get('size') ?? 10);
      const county = params.get('counties');
      const muni = params.get('municipalities');
      const toIso = (v: any) => {
        const ms = +v;
        const epoch = ms < 100_000_000_000 ? ms * 1000 : ms;
        return new Date(epoch).toISOString().slice(0, 10);
      };
      let poles: any[] = date
        ? MOCK_POLES.filter((p: any) => toIso(p.capturedDate) === date)
        : MOCK_POLES;
      if (county) poles = poles.filter((p: any) => p.county === county);
      if (muni) poles = poles.filter((p: any) => p.municipality === muni);
      const start = page * size;
      return ok({
        content: poles.slice(start, start + size),
        page,
        size,
        totalElements: poles.length,
        hasMore: start + size < poles.length,
      });
    }

    // /poles/inspector/:id/stats  — must come before /poles/inspector/:id
    let m = path.match(/^\/poles\/inspector\/([^/]+)\/stats$/);
    if (method === 'GET' && m) return ok(MOCK_INSPECTOR_STATS);

    m = path.match(/^\/poles\/inspector\/([^/]+)$/);
    if (method === 'GET' && m) {
      const inspId = m[1];
      return ok(MOCK_POLES.filter((p: any) => p.assignedInspector === inspId));
    }

    if (method === 'POST' && path === '/poles/near')
      return ok(MOCK_POLES.slice(0, 3));

    m = path.match(/^\/poles\/id\/([^/]+)$/);
    if (method === 'GET' && m) {
      const pid = m[1];
      return ok(MOCK_POLES.find((p: any) => p.id === pid) ?? MOCK_POLES[0]);
    }

    if (method === 'PUT' && /^\/poles\/[^/]+$/.test(path)) return ok(req.body);
    if (method === 'DELETE' && /^\/poles\/[^/]+$/.test(path)) return ok({});

    // USERS / INSPECTORS
    if (method === 'GET' && path === '/users')
      return ok({ success: true, message: 'OK', data: MOCK_INSPECTORS });
    if (method === 'DELETE' && /^\/users\/[^/]+$/.test(path)) return ok({});
    if (method === 'PUT' && /^\/users\/[^/]+$/.test(path)) return ok(req.body);

    // NOTIFICATIONS
    if (method === 'GET' && path === '/notifications')
      return ok(MOCK_NOTIFICATIONS);
    if (path.includes('/mark-as-read')) return ok({});
    if (method === 'DELETE' && /^\/notifications\/[^/]+$/.test(path))
      return ok({});
    if (method === 'POST' && path === '/notifications/clear-read')
      return ok({});

    // CAPTURES
    if (method === 'GET' && path === '/captures') return ok(MOCK_CAPTURES);
    if (path.startsWith('/captures/dateRange')) return ok(MOCK_CAPTURES);
    if (method === 'POST' && path === '/captures')
      return ok({ ...req.body, id: `cap-${Date.now()}` });
    if (/^\/captures\/[^/]+$/.test(path)) {
      if (method === 'GET') return ok(MOCK_CAPTURES[0]);
      if (method === 'PUT') return ok(req.body);
      if (method === 'DELETE') return ok({});
    }

    return new HttpResponse({ status: 200, body: {} });
  }

  private authResp(): unknown {
    return {
      success: true,
      message: 'OK',
      data: {
        token: this.fakeToken,
        refreshToken: 'mock-refresh-token',
        type: 'Bearer',
        expiresIn: 86400000,
        user: MOCK_USER,
      },
    };
  }
}

// ── mock data ─────────────────────────────────────────────────────────────────

const MOCK_USER = {
  id: '1',
  userName: 'admin',
  email: 'admin@vegvesen.no',
  firstName: 'Admin',
  lastName: 'Bruker',
  phoneNumber: '+47 22 07 30 00',
  role: 'ADMIN',
  profileImage: '',
  createdAt: '2024-01-01T00:00:00Z',
  county: 'Oslo',
};

const MOCK_INSPECTORS = [
  {
    id: 'insp-1',
    userName: 'lars.hansen',
    firstName: 'Lars',
    lastName: 'Hansen',
    email: 'lars.hansen@vegvesen.no',
    phoneNumber: '+47 22 07 30 01',
    county: 'Oslo',
    role: 'INSPECTOR',
    createdAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'insp-2',
    userName: 'kari.olsen',
    firstName: 'Kari',
    lastName: 'Olsen',
    email: 'kari.olsen@vegvesen.no',
    phoneNumber: '+47 22 07 30 02',
    county: 'Viken',
    role: 'INSPECTOR',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'insp-3',
    userName: 'erik.berg',
    firstName: 'Erik',
    lastName: 'Berg',
    email: 'erik.berg@vegvesen.no',
    phoneNumber: '+47 22 07 30 03',
    county: 'Akershus',
    role: 'INSPECTOR',
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'insp-4',
    userName: 'mette.johansen',
    firstName: 'Mette',
    lastName: 'Johansen',
    email: 'mette.johansen@vegvesen.no',
    phoneNumber: '+47 22 07 30 04',
    county: 'Akershus',
    role: 'INSPECTOR',
    createdAt: '2024-02-15T00:00:00Z',
  },
];

function mkImg(
  id: string,
  ts: number,
  status: string,
  action?: string,
  notes?: string,
) {
  return {
    imageId: id,
    capturedDate: ts,
    inspectionStatus: status,
    action: action ?? null,
    notes: notes ?? null,
    inspectionDate: status !== 'not inspected' ? ts + 86400000 : null,
    dueDate:
      action === 'Replace'
        ? ts + 28 * 86400000 // individual missing → 4 weeks
        : action === 'Replace (consecutive)'
          ? ts + 14 * 86400000 // consecutive missing → 2 weeks
          : action === 'Reposition/Realign'
            ? ts + 7 * 86400000 // bent/misleading → 1 week
            : null,
  };
}

// capturedDate stored as epoch-ms numeric string so toEpochMillis() works correctly
function mkPole(
  id: string,
  ts: number,
  county: string,
  municipality: string,
  coords: [number, number],
  roadCat: string,
  roadNum: number,
  dist: number,
  inspector: string,
  images: ReturnType<typeof mkImg>[],
) {
  return {
    id,
    capturedDate: String(ts),
    county,
    municipality,
    assignedInspector: inspector,
    images,
    location: { type: 'Point', coordinates: coords },
    roadCategory: roadCat,
    roadNumber: roadNum,
    distanceFromRoad: dist,
    altitude: 12.5,
    satellitesUsed: 8,
    hdop: 0.9,
    fixType: 3,
    fieldOfView: 120,
    speed: 0,
    courseOverGround: 45,
    lastModified: ts + 172800000,
  };
}

const D1 = new Date('2026-04-15').getTime();
const D2 = new Date('2026-04-20').getTime(); // 1708387200000
const D3 = new Date('2026-03-10').getTime(); // 1710028800000
const D4 = new Date('2026-04-05').getTime(); // 1712275200000

const MOCK_POLES = [
  mkPole(
    'pole-1',
    D1,
    'Akershus',
    'Lillestrøm',
    [11.462, 59.7822],
    'K',
    150,
    2.3,
    'insp-1',
    [mkImg('img-001', D1, 'Not inspected')],
  ),
  mkPole(
    'pole-2',
    D1,
    'Akershus',
    'Lillestrøm',
    [11.4618, 59.7817],
    'K',
    162,
    1.8,
    'insp-1',
    [mkImg('img-002', D1, 'Inspected', 'Replace')],
  ),
  mkPole(
    'pole-3',
    D2,
    'Akershus',
    'Lillestrøm',
    [11.4617, 59.7812],
    'F',
    4,
    3.1,
    'insp-1',
    [mkImg('img-003', D2, 'Inspected', 'Reposition/Realign')],
  ),
  mkPole(
    'pole-4',
    D2,
    'Akershus',
    'Lillestrøm',
    [11.4615, 59.7809],
    'E',
    6,
    4.7,
    'insp-1',
    [
      mkImg('img-004', D2, 'Inspected', 'No action needed'),
      mkImg('img-005', D2, 'Inspected', 'OK'),
    ],
  ),
];

const MOCK_SUMMARY = {
  dates: [
    { capturedDate: D1, count: 2 },
    { capturedDate: D2, count: 2 },
    { capturedDate: D3, count: 2 },
    { capturedDate: D4, count: 2 },
  ],
  countyData: [
    { county: 'Akershus', municipalities: ['Lillestrøm'] },
    { county: 'Viken', municipalities: ['Bærum'] },
  ],
  availableCounties: ['Akershus', 'Viken'],
  availableMunicipalities: ['Lillestrøm', 'Bærum'],
};

const MOCK_CAPTURED_DATES = {
  dates: [D1, D2, D3, D4],
};

const MOCK_DASHBOARD_STATS = {
  totalPoles: 600,
  inspectedCount: 120,
  captureDates: [
    { capturedDate: D1, count: 20 },
    { capturedDate: D2, count: 31 },
    { capturedDate: D3, count: 50 },
    { capturedDate: D4, count: 12 },
  ],
  byCounty: [
    { county: 'Akershus', count: 6 },
    { county: 'Viken', count: 2 },
  ],
  byInspector: [
    { inspectorId: 'insp-1', inspected: 97, pending: 53 },
    { inspectorId: 'insp-2', inspected: 43, pending: 100 },
    { inspectorId: 'insp-3', inspected: 160, pending: 40 },
    { inspectorId: 'insp-4', inspected: 87, pending: 20 },
  ],
  recentInspections: [
    {
      poleId: 'pole-7',
      county: 'Akershus',
      action: 'No action needed',
      assignedInspector: 'insp-4',
      inspectionDate: D4 + 86400000,
    },
    {
      poleId: 'pole-1',
      county: 'Akershus',
      action: 'Reposition/Realign',
      assignedInspector: 'insp-1',
      inspectionDate: D1 + 86400000,
    },
    {
      poleId: 'pole-4',
      county: 'Akershus',
      action: 'Replace',
      assignedInspector: 'insp-3',
      inspectionDate: D2 + 86400000,
    },
    {
      poleId: 'pole-6',
      county: 'Akershus',
      action: 'Replace',
      assignedInspector: 'insp-3',
      inspectionDate: D3 + 86400000,
    },
  ],
};

const MOCK_INSPECTOR_STATS = {
  totalAssigned: 200,
  inspectedCount: 160,
  byAction: [
    { action: 'No action needed', count: 5 },
    { action: 'Replace', count: 3 },
    { action: 'Reposition/Realign', count: 2 },
  ],
  byCounty: [{ county: 'Akershus', count: 200 }],
  byMunicipality: [
    { municipality: 'Lillestrøm', count: 110 },
    { municipality: 'Nes', count: 30 },
    { municipality: 'Gjerdrum', count: 60 },
  ],
  recentActivity: [
    {
      poleId: 'pole-4',
      county: 'Akershus',
      action: 'No action needed',
      inspectionDate: D2 + 3 * 86400000,
    },
    {
      poleId: 'pole-3',
      county: 'Akershus',
      action: 'Reposition/Realign',
      inspectionDate: D2 + 86400000,
    },
    {
      poleId: 'pole-2',
      county: 'Akershus',
      action: 'Replace',
      inspectionDate: D1 + 2 * 86400000,
    },
    {
      poleId: 'pole-1',
      county: 'Akershus',
      action: 'No action needed',
      inspectionDate: D1 + 86400000,
    },
    {
      poleId: 'pole-8',
      county: 'Akershus',
      action: 'Replace',
      inspectionDate: D4 + 2 * 86400000,
    },
    {
      poleId: 'pole-7',
      county: 'Akershus',
      action: 'No action needed',
      inspectionDate: D4 + 86400000,
    },
    {
      poleId: 'pole-6',
      county: 'Akershus',
      action: 'No action needed',
      inspectionDate: D3 + 3 * 86400000,
    },
    {
      poleId: 'pole-5',
      county: 'Viken',
      action: 'Replace',
      inspectionDate: D3 + 2 * 86400000,
    },
    {
      poleId: 'pole-10',
      county: 'Viken',
      action: 'Reposition/Realign',
      inspectionDate: D3 + 86400000,
    },
    {
      poleId: 'pole-9',
      county: 'Akershus',
      action: 'No action needed',
      inspectionDate: D3,
    },
  ],
};

const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'capture',
    poleIds: ['pole-1', 'pole-2'],
    severity: 'info',
    createdDate: D1 + 3600000,
    polesCount: 2,
    read: false,
  },
  {
    id: 'notif-2',
    type: 'capture',
    poleIds: ['pole-3', 'pole-4'],
    severity: 'warning',
    createdDate: D2 + 3600000,
    polesCount: 2,
    read: false,
  },
  {
    id: 'notif-3',
    type: 'capture',
    poleIds: ['pole-5', 'pole-6'],
    severity: 'info',
    createdDate: D3 + 3600000,
    polesCount: 2,
    read: true,
  },
];

const MOCK_CAPTURES = [
  {
    id: 'cap-1',
    poles: ['pole-1', 'pole-2'],
    startDate: D1,
    endDate: D1 + 7 * 86400000,
    createdDate: D1 - 86400000,
  },
  {
    id: 'cap-2',
    poles: ['pole-3', 'pole-4'],
    startDate: D2,
    endDate: D2 + 10 * 86400000,
    createdDate: D2 - 86400000,
  },
  {
    id: 'cap-3',
    poles: ['pole-5', 'pole-6'],
    startDate: D3,
    endDate: D3 + 14 * 86400000,
    createdDate: D3 - 86400000,
  },
];
