import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InspectorService, Inspector } from '../service/inspector.service';
import { NavComponent } from '../navbar/nav.component';
import { AddInspectorComponent } from '../add-inspector/add-inspector.component';

@Component({
  selector: 'app-inspectors',
  templateUrl: './inspectors.component.html',
  imports: [NavComponent, CommonModule, FormsModule, AddInspectorComponent],
})
export class InspectorsComponent implements OnInit {
  inspectors: Inspector[] = [];
  searchQuery = '';
  showAddInspectorModal = false;

  private inspectorService = inject(InspectorService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadInspectors();
  }

  loadInspectors(): void {
    this.inspectorService.getInspectors().subscribe({
      next: (data) => { this.inspectors = data; },
      error: (err) => { console.error('Failed to load inspectors:', err); },
    });
  }

  search(): void {
    if (!this.searchQuery.trim()) {
      this.loadInspectors();
      return;
    }
    const query = this.searchQuery.toLowerCase();
    this.inspectors = this.inspectors.filter(
      (i) =>
        i.firstName?.toLowerCase().includes(query) ||
        i.lastName?.toLowerCase().includes(query) ||
        i.email.toLowerCase().includes(query),
    );
  }

  removeInspector(id: string): void {
    this.inspectorService.removeInspector(id).subscribe({
      next: () => { this.loadInspectors(); },
      error: (err) => { console.error('Failed to remove inspector:', err); },
    });
  }

  getInitials(firstName?: string, lastName?: string): string {
    return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase();
  }

  getAvatarColor(id: string): string {
    const colors = [
      'bg-sky-700',
      'bg-indigo-700',
      'bg-emerald-700',
      'bg-violet-700',
      'bg-rose-700',
      'bg-amber-700',
    ];
    const seed = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[seed % colors.length];
  }

  viewAnalytics(id: string): void {
    this.router.navigate(['/inspector-analytics', id]);
  }

  openAddInspectorModal(): void {
    this.showAddInspectorModal = true;
  }

  closeAddInspectorModal(): void {
    this.showAddInspectorModal = false;
  }

  onInspectorAdded(): void {
    this.closeAddInspectorModal();
    this.loadInspectors();
  }
}
