import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { PoleInterface } from '../interfaces/pole-interface';

@Injectable({
  providedIn: 'root',
})
export class SharedDataServiceService {
  private polesDataSubject = new BehaviorSubject<PoleInterface[]>([]);
  private poleData = signal<PoleInterface>({ id: '' });

  getPolesData() {
    return this.polesDataSubject.asObservable();
  }

  setPolesData(data: PoleInterface[]) {
    this.polesDataSubject.next(data);
  }

  setPoleData(data: PoleInterface) {
    this.poleData.set(data);
  }

  getPoleData() {
    return this.poleData;
  }
}
