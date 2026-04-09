import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InspectorService, Inspector } from '../service/inspector.service';
import { NavComponent } from '../navbar/nav.component';
import { AddInspectorComponent } from '../add-inspector/add-inspector.component';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-inspectors',
  templateUrl: './inspectors.component.html',
  imports: [
    NavComponent,
    CommonModule,
    MatIcon,
    FormsModule,
    AddInspectorComponent,
  ],
})
export class InspectorsComponent implements OnInit {
  inspectors: Inspector[] = [];
  selectedInspector: Inspector | null = null;
  searchQuery = '';
  showAllPoles = false;
  showAddInspectorModal = false;
  assignedPoles = [
    { id: 'A-1042', location: 'Trondheim' },
    { id: 'A-1043', location: 'Oslo' },
    { id: 'A-1044', location: 'Bergen' },
    { id: 'A-1045', location: 'Stavanger' },
    { id: 'A-1046', location: 'Kristiansand' },
    { id: 'A-1047', location: 'Tromsø' },
    { id: 'A-1048', location: 'Drammen' },
    { id: 'A-1049', location: 'Fredrikstad' },
    { id: 'A-1050', location: 'Porsgrunn' },
    { id: 'A-1051', location: 'Skien' },
  ];
  totalPoles = 148;

  private inspectorService = inject(InspectorService);

  get visiblePoles() {
    return this.showAllPoles
      ? this.assignedPoles
      : this.assignedPoles.slice(0, 6);
  }

  ngOnInit(): void {
    this.loadInspectors();
  }

  loadInspectors() {
    this.inspectorService.getInspectors().subscribe((data) => {
      this.inspectors = data;
      this.selectedInspector = data[0];
    });
  }

  selectInspector(inspector: Inspector) {
    this.selectedInspector = inspector;
  }

  getInitials(
    firstName: string | undefined,
    lastName: string | undefined,
  ): string {
    const first = (firstName || '').trim()[0] || '';
    const last = (lastName || '').trim()[0] || '';
    return (first + last).toUpperCase();
  }

  search() {
    if (!this.searchQuery || !this.searchQuery.trim()) {
      this.loadInspectors();
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.inspectors = this.inspectors.filter(
      (inspector) =>
        inspector.firstName?.toLowerCase().includes(query) ||
        inspector.lastName?.toLowerCase().includes(query) ||
        inspector.email.toLowerCase().includes(query),
    );
  }

  removeInspector(id: number) {
    this.inspectorService.removeInspector(id).subscribe(() => {
      if (this.selectedInspector?.id === id) {
        this.selectedInspector = null;
      }
      this.loadInspectors();
    });
  }

  openAddInspectorModal() {
    this.showAddInspectorModal = true;
  }

  closeAddInspectorModal() {
    this.showAddInspectorModal = false;
  }

  onInspectorAdded() {
    this.closeAddInspectorModal();
    this.loadInspectors();
  }
}
