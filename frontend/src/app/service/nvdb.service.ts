import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface AadtResult {
  total: number;
  heavyVehiclePct: number;
  year: number;
  roadName: string | null;
}

@Injectable({ providedIn: 'root' })
export class NvdbService {
  private readonly BASE = 'https://nvdbapiles.atlas.vegvesen.no';
  private readonly CLIENT = 'snowpole-inspection-app';
  private readonly DELTA = 0.02; // ~2 km bounding box

  private http = inject(HttpClient);

  getAadt(lat: number, lon: number): Observable<AadtResult | null> {
    const bbox = `${lon - this.DELTA},${lat - this.DELTA},${lon + this.DELTA},${lat + this.DELTA}`;
    const url = `${this.BASE}/vegobjekter/540?kartutsnitt=${bbox}&srid=4326&inkluder=egenskaper,lokasjon&antall=10`;

    return this.http
      .get<any>(url, { headers: { 'X-Client': this.CLIENT } })
      .pipe(
        map((res) => this.extractBest(res?.objekter ?? [])),
        catchError(() => of(null)),
      );
  }

  private extractBest(objekter: any[]): AadtResult | null {
    if (!objekter.length) return null;

    const parsed = objekter
      .map((obj) => this.parseObjekt(obj))
      .filter((o): o is AadtResult => o !== null);

    if (!parsed.length) return null;

    // pick highest ÅDT total (main road nearest the pole)
    return parsed.reduce((best, cur) => (cur.total > best.total ? cur : best));
  }

  private parseObjekt(obj: any): AadtResult | null {
    const props = obj.egenskaper as any[] | undefined;
    if (!props) return null;

    const find = (id: number) => props.find((p) => p.id === id)?.verdi ?? null;

    const total = find(4623);
    if (total === null) return null;

    return {
      total: total as number,
      heavyVehiclePct: (find(4624) as number) ?? 0,
      year: (find(4621) as number) ?? 0,
      roadName: obj.lokasjon?.adresser?.[0]?.navn ?? null,
    };
  }
}
