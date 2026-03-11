import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PersonService {
  getPerson() {
    return { name: 'John Doe', age: 30 };
  }
}
