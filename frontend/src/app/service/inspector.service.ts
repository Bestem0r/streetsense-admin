import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Inspector {
  id: number;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  county?: string;
  role?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root',
})
export class InspectorService {
  // Mock inspector list - can be replaced with API call

  // firstName, lastName, email, phone, county, role, status
  private inspectors: Inspector[] = [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Anderson',
      email: 'john.anderson@example.com',
      phone: '123-456-7890',
      county: 'Oslo',
      role: 'Field Inspector',
      status: 'Active',
    },
    {
      id: 2,
      firstName: 'Sarah',
      lastName: 'Jensen',
      email: 'sarah.jensen@example.com',
      phone: '098-765-4321',
      county: 'Viken',
      role: 'Senior Inspector',
      status: 'Active',
    },
    {
      id: 3,
      firstName: 'Mike',
      lastName: 'Thompson',
      email: 'mike.thompson@example.com',
      phone: '555-555-5555',
      county: 'Trøndelag',
      role: 'Field Inspector',
      status: 'Inactive',
    },
    {
      id: 4,
      firstName: 'Lisa',
      lastName: 'Olsen',
      email: 'lisa.olsen@example.com',
      phone: '111-111-1111',
      county: 'Oslo',
      role: 'Supervisor',
      status: 'Active',
    },
    {
      id: 5,
      firstName: 'Erik',
      lastName: 'Kristensen',
      email: 'erik.kristensen@example.com',
      phone: '222-222-2222',
      county: 'Viken',
      role: 'Field Inspector',
      status: 'Active',
    },
    {
      id: 6,
      firstName: 'Anna',
      lastName: 'Bergström',
      email: 'anna.bergström@example.com',
      phone: '333-333-3333',
      county: 'Trøndelag',
      role: 'Senior Inspector',
      status: 'Inactive',
    },
    {
      id: 7,
      firstName: 'Tommy',
      lastName: 'Nilsson',
      email: 'tommy.nilsson@example.com',
      phone: '444-444-4444',
      county: 'Oslo',
      role: 'Field Inspector',
      status: 'Active',
    },
    {
      id: 8,
      firstName: 'Maria',
      lastName: 'Svensson',
      email: 'maria.svensson@example.com',
      phone: '555-555-5555',
      county: 'Viken',
      role: 'Senior Inspector',
      status: 'Active',
    },
    {
      id: 9,
      firstName: 'David',
      lastName: 'Larsen',
      email: 'david.larsen@example.com',
      phone: '666-666-6666',
      county: 'Trøndelag',
      role: 'Field Inspector',
      status: 'Inactive',
    },
    {
      id: 10,
      firstName: 'Emma',
      lastName: 'Johansson',
      email: 'emma.johansson@example.com',
      phone: '777-777-7777',
      county: 'Oslo',
      role: 'Supervisor',
      status: 'Active',
    },
    {
      id: 11,
      firstName: 'Peter',
      lastName: 'Hansen',
      email: 'peter.hansen@example.com',
      phone: '888-888-8888',
      county: 'Viken',
      role: 'Field Inspector',
      status: 'Active',
    },
  ];

  /**
   * Get all available inspectors
   * @returns Observable of inspector array
   */
  getInspectors(): Observable<Inspector[]> {
    return of([...this.inspectors]);
    // Future: Replace with HTTP call
    // return this.http.get<Inspector[]>('/api/inspectors');
  }

  /**
   * Get a single inspector by ID
   * @param id Inspector ID
   * @returns Observable of inspector
   */
  getInspectorById(id: number): Observable<Inspector | undefined> {
    return of(this.inspectors.find((inspector) => inspector.id === id));
  }

  /**
   * Search inspectors by name or email
   * @param query Search query
   * @returns Observable of filtered inspector array
   */
  searchInspectors(query: string): Observable<Inspector[]> {
    const lowerQuery = query.toLowerCase();
    const filtered = this.inspectors.filter(
      (inspector) =>
        (inspector.firstName &&
          inspector.firstName.toLowerCase().includes(lowerQuery)) ||
        (inspector.lastName &&
          inspector.lastName.toLowerCase().includes(lowerQuery)) ||
        inspector.email.toLowerCase().includes(lowerQuery),
    );
    return of(filtered);
  }

  removeInspector(id: number): Observable<void> {
    this.inspectors = this.inspectors.filter(
      (inspector) => inspector.id !== id,
    );
    return of();
  }

  /**
   * Add a new inspector
   * @param inspector Inspector data (without ID)
   * @returns Observable of the created inspector
   */
  addInspector(inspector: Omit<Inspector, 'id'>): Observable<Inspector> {
    const newId = Math.max(...this.inspectors.map((i) => i.id), 0) + 1;
    const newInspector: Inspector = {
      id: newId,
      ...inspector,
    };
    this.inspectors.push(newInspector);
    return of(newInspector);
  }
}
