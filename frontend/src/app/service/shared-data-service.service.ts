import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PolesInterface } from '../interfaces/poles-interface';

@Injectable({
  providedIn: 'root',
})
export class SharedDataServiceService {
  private polesDataSubject = new BehaviorSubject<PolesInterface[]>([]);
  private poleData = signal<PolesInterface>({ poleId: '' });

  getPolesData() {
    return this.polesDataSubject.asObservable();
  }

  setPolesData(data: PolesInterface[]) {
    this.polesDataSubject.next(data);
  }

  setPoleData(data: PolesInterface) {
    this.poleData.set(data);
  }

  getPoleData() {
    return this.poleData;
  }
}
