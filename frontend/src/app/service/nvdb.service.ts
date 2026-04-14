import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Veikategori } from '../enums/vegkategori.enum';
import { veiSystem } from '../interfaces/vei-system';

@Injectable({
  providedIn: 'root',
})
export class NVDBService {
  private http = inject(HttpClient);

  async getVeiInfo(lat: number, lon: number): Promise<veiSystem | null> {
    const url = `https://nvdbapiles.atlas.vegvesen.no/vegnett/api/v4/posisjon?lat=${lat}&lon=${lon}`;

    const data = await firstValueFrom(this.http.get<any[]>(url));
    const veiSystem = data[0];
    console.log('Received data from NVDB API:', veiSystem);
    if (!veiSystem) return null;
    if (!this.isVegkategori(veiSystem.vegsystemreferanse.vegsystem.vegkategori))
      return null;
    return {
      vegkategori: veiSystem.vegsystemreferanse.vegsystem.vegkategori,
      nummer: veiSystem.vegsystemreferanse.vegsystem.nummer,
      avstand: veiSystem.avstand,
    };
  }

  isVegkategori(value: string): value is Veikategori {
    return Object.values(Veikategori).includes(value as Veikategori);
  }
}
