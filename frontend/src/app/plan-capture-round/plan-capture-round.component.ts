import { Component, inject, OnChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';

import { NavComponent } from '../navbar/nav.component';
import { MapViewComponent } from '../map-view/map-view.component';
import { PolesService } from '../service/poles.service';
import { PoleInterface } from '../interfaces/pole-interface';
import { CaptureInterface } from '../interfaces/Capture-interface';
import { PlanCaptureService } from '../service/plan-capture.service';
import { Toast } from '../utils/toast';
import { MatDialog } from '@angular/material/dialog';
import { CreateCaptureDialogComponent } from '../create-capture-dialog/create-capture-dialog.component';

type GroupBy =
  | 'road'
  | 'county'
  | 'municipality'
  | 'county_road'
  | 'municipality_road';

type GroupedPoles = Record<string, PoleInterface[]>;

type HierarchicalGroupedPoles = Record<string, Record<string, PoleInterface[]>>;

@Component({
  selector: 'app-plan-capture-round-1',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIcon, NavComponent, MapViewComponent],
  templateUrl: './plan-capture-round.component.html',
  styleUrl: './plan-capture-round.component.scss',
  providers: [],
})
export class PlanCaptureRoundComponent implements OnInit, OnChanges {
  poles: PoleInterface[] = [];
  focusedPole: string | null = null;
  plannedCaptures: CaptureInterface[] = [];
  groupedPoles: GroupedPoles = {};
  hierarchicalGroupedPoles: HierarchicalGroupedPoles = {};
  groupBy: GroupBy = 'county';
  selectedParentGroup: string | null = null;
  expandedGroups = new Set<string>();
  expandedSubGroups = new Set<string>();
  expandedPolesList = new Set<string>();
  startDate: string = new Date().toISOString().split('T')[0];
  endDate: string = new Date().toISOString().split('T')[0];

  activeTab: 0 | 1 = 0;
  viewingCapture: CaptureInterface | null = null;

  readonly groupByOptions: {
    value: GroupBy;
    label: string;
    tooltip?: string;
  }[] = [
    { value: 'county', label: 'County' },
    { value: 'municipality', label: 'Municipality' },
    { value: 'road', label: 'Road Route' },
    {
      value: 'county_road',
      label: 'County → Road',
      tooltip: 'Plan for specific road in a county',
    },
    {
      value: 'municipality_road',
      label: 'Municipality → Road',
      tooltip: 'Plan for specific road in a municipality',
    },
  ];

  private polesService = inject(PolesService);
  private planCaptureService = inject(PlanCaptureService);
  private toast = inject(Toast);
  private dialog = inject(MatDialog);
  ngOnInit(): void {
    this.loadPoles();
    this.loadCaptures();
  }

  ngOnChanges(): void {
    this.loadCaptures();
  }

  loadPoles(): void {
    this.polesService.getPoles().subscribe((data) => {
      this.poles = data as PoleInterface[];
      this.groupPoles();
    });
  }

  loadCaptures(): void {
    this.planCaptureService.getCaptures().subscribe((captures) => {
      this.plannedCaptures = captures;
    });
  }

  private getRoadKey(pole: PoleInterface): string {
    if (pole.roadCategory && pole.roadNumber != null) {
      return `${pole.roadCategory} ${pole.roadNumber}`;
    }
    return 'Unknown Road';
  }
  groupPoles(): void {
    this.groupedPoles = {};
    this.hierarchicalGroupedPoles = {};

    switch (this.groupBy) {
      case 'county':
      case 'municipality':
      case 'road':
        // Flat grouping
        this.poles.forEach((pole) => {
          let groupKey = '';

          switch (this.groupBy) {
            case 'county':
              groupKey = pole.county || 'Unknown';
              break;
            case 'municipality':
              groupKey = pole.municipality || 'Unknown';
              break;
            case 'road':
              groupKey = this.getRoadKey(pole);
              break;
          }

          if (!this.groupedPoles[groupKey]) {
            this.groupedPoles[groupKey] = [];
          }
          this.groupedPoles[groupKey].push(pole);
        });
        break;

      case 'county_road':
        this.poles.forEach((pole) => {
          const parentKey = pole.county || 'Unknown';
          const roadKey = this.getRoadKey(pole);

          if (!this.hierarchicalGroupedPoles[parentKey]) {
            this.hierarchicalGroupedPoles[parentKey] = {};
          }
          if (!this.hierarchicalGroupedPoles[parentKey][roadKey]) {
            this.hierarchicalGroupedPoles[parentKey][roadKey] = [];
          }
          this.hierarchicalGroupedPoles[parentKey][roadKey].push(pole);
        });
        break;

      case 'municipality_road':
        this.poles.forEach((pole) => {
          const parentKey = pole.municipality || 'Unknown';
          const roadKey = this.getRoadKey(pole);

          if (!this.hierarchicalGroupedPoles[parentKey]) {
            this.hierarchicalGroupedPoles[parentKey] = {};
          }
          if (!this.hierarchicalGroupedPoles[parentKey][roadKey]) {
            this.hierarchicalGroupedPoles[parentKey][roadKey] = [];
          }
          this.hierarchicalGroupedPoles[parentKey][roadKey].push(pole);
        });
        break;
    }
  }

  onGroupByChange(newGroupBy: GroupBy): void {
    this.groupBy = newGroupBy;
    this.selectedParentGroup = null;
    this.expandedGroups.clear();
    this.expandedSubGroups.clear();

    this.groupPoles();
  }

  selectParentGroup(parentKey: string): void {
    this.selectedParentGroup =
      this.selectedParentGroup === parentKey ? null : parentKey;
    this.expandedSubGroups.clear();
  }

  getRoadsForParent(parentKey: string): string[] {
    if (!this.hierarchicalGroupedPoles[parentKey]) return [];
    return Object.keys(this.hierarchicalGroupedPoles[parentKey]).sort();
  }

  toggleSubGroup(key: string): void {
    if (this.expandedSubGroups.has(key)) {
      this.expandedSubGroups.delete(key);
    } else {
      this.expandedSubGroups.add(key);
    }
  }

  isSubGroupExpanded(key: string): boolean {
    return this.expandedSubGroups.has(key);
  }

  toggleGroup(groupKey: string): void {
    if (this.expandedGroups.has(groupKey)) {
      this.expandedGroups.delete(groupKey);
    } else {
      this.expandedGroups.add(groupKey);
    }
  }

  isGroupExpanded(groupKey: string): boolean {
    return this.expandedGroups.has(groupKey);
  }

  togglePolesList(key: string): void {
    if (this.expandedPolesList.has(key)) {
      this.expandedPolesList.delete(key);
    } else {
      this.expandedPolesList.add(key);
    }
  }

  isPolesListExpanded(key: string): boolean {
    return this.expandedPolesList.has(key);
  }

  get groupKeys(): string[] {
    if (this.isHierarchical()) {
      return this.getParentGroupKeys();
    }
    return Object.keys(this.groupedPoles).sort();
  }

  getTotalPoles(): number {
    return this.poles.length;
  }

  createCaptureRound(groupKey: string, subGroupKey?: string): void {
    let selectedPoles: PoleInterface[] = [];

    if (this.isHierarchical() && subGroupKey) {
      selectedPoles = this.hierarchicalGroupedPoles[groupKey][subGroupKey];
    } else if (this.isHierarchical()) {
      Object.values(this.hierarchicalGroupedPoles[groupKey]).forEach(
        (poles) => {
          selectedPoles.push(...poles);
        },
      );
    } else {
      selectedPoles = this.groupedPoles[groupKey];
    }

    const ref = this.dialog.open(CreateCaptureDialogComponent, {
      data: { poleIds: selectedPoles.map((p) => p.id) },
      disableClose: false,
    });

    ref.afterClosed().subscribe((created: CaptureInterface | undefined) => {
      if (created) this.loadCaptures();
    });
  }

  getCaptureInfo(capture: CaptureInterface): {
    counties: string[];
    municipalities: string[];
    roads: string[];
  } {
    const ids = new Set(capture.poles);
    const capturePoles = this.poles.filter((p) => ids.has(p.id));
    const counties = [
      ...new Set(capturePoles.map((p) => p.county).filter(Boolean)),
    ] as string[];
    const municipalities = [
      ...new Set(capturePoles.map((p) => p.municipality).filter(Boolean)),
    ] as string[];
    const roads = [
      ...new Set(
        capturePoles
          .map((p) => this.getRoadKey(p))
          .filter((r) => r !== 'Unknown Road'),
      ),
    ];
    return { counties, municipalities, roads };
  }

  isHierarchical(): boolean {
    return ['county_road', 'municipality_road'].includes(this.groupBy);
  }

  getParentGroupKeys(): string[] {
    return Object.keys(this.hierarchicalGroupedPoles).sort();
  }

  getParentGroupPoleCount(parentKey: string): number {
    let count = 0;
    Object.values(this.hierarchicalGroupedPoles[parentKey] || {}).forEach(
      (poles) => {
        count += poles.length;
      },
    );
    return count;
  }

  switchTab(tabIndex: 0 | 1): void {
    this.activeTab = tabIndex;
  }

  viewCapture(capture: CaptureInterface): void {
    this.viewingCapture = capture;
  }

  stopViewing(): void {
    this.viewingCapture = null;
  }

  get viewedPoles(): PoleInterface[] {
    if (!this.viewingCapture) return this.poles;
    const ids = new Set(this.viewingCapture.poles);
    return this.poles.filter((p) => ids.has(p.id));
  }

  deleteCaptureRound(id: string): void {
    if (!confirm('Delete this capture round?')) return;
    this.planCaptureService.deleteCapture(id).subscribe({
      next: () => {
        this.plannedCaptures = this.plannedCaptures.filter((c) => c.id !== id);
        if (this.viewingCapture?.id === id) this.viewingCapture = null;
        this.toast.show('Capture round deleted.', 'Close', 3000);
      },
      error: () => this.toast.show('Failed to delete capture.', 'Close', 3000),
    });
  }
}
