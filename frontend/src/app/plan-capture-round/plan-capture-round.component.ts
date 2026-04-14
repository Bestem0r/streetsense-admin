import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NavComponent } from '../navbar/nav.component';
import { MapViewComponent } from '../map-view/map-view.component';
import { PolesService } from '../service/poles.service';
import { NVDBService } from '../service/nvdb.service';
import { PoleInterface } from '../interfaces/pole-interface';
import { CaptureInterface } from '../interfaces/Capture-interface';
import { PlanCaptureService } from '../service/plan-capture.service';

type GroupBy =
  | 'road'
  | 'county'
  | 'municipality'
  | 'county_road'
  | 'municipality_road';

type GroupedPoles = Record<string, PoleInterface[]>;

type HierarchicalGroupedPoles = Record<string, Record<string, PoleInterface[]>>;

interface PoleWithRoad extends PoleInterface {
  roadNumber?: string;
}

@Component({
  selector: 'app-plan-capture-round-1',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIcon, NavComponent, MapViewComponent],
  templateUrl: './plan-capture-round.component.html',
  styleUrl: './plan-capture-round.component.scss',
  providers: [],
})
export class PlanCaptureRoundComponent implements OnInit {
  poles: PoleWithRoad[] = [];
  focusedPole: string | null = null;
  groupedPoles: GroupedPoles = {};
  hierarchicalGroupedPoles: HierarchicalGroupedPoles = {};
  groupBy: GroupBy = 'county';
  selectedParentGroup: string | null = null; // For county_road or municipality_road
  expandedGroups = new Set<string>();
  expandedSubGroups = new Set<string>();
  expandedPolesList = new Set<string>(); // Track which road's full pole list is expanded
  loadingRoads = false;
  startDate: string = new Date().toISOString().split('T')[0];
  endDate: string = new Date().toISOString().split('T')[0];

  activeTab: 0 | 1 = 0; // Track which tab is active

  private polesService = inject(PolesService);
  private nvdbService = inject(NVDBService);
  private planCaptureService = inject(PlanCaptureService);
  private _snackBar = inject(MatSnackBar);
  ngOnInit(): void {
    this.loadPoles();
  }

  loadPoles(): void {
    this.polesService.getPoles().subscribe((data) => {
      this.poles = data as PoleWithRoad[];
      this.groupPoles();
    });
  }

  // midlertidig funksjon, for treig. vei info bør lagres i databasen.
  async fetchRoadNumbers(): Promise<void> {
    this.loadingRoads = true;

    const polesToFetch = this.poles.filter(
      (p) => p.location?.coordinates && !p.roadNumber,
    );

    const concurrency = 5;
    const delayMs = 300;

    for (let i = 0; i < polesToFetch.length; i += concurrency) {
      const chunk = polesToFetch.slice(i, i + concurrency);

      await Promise.all(
        chunk.map(async (pole) => {
          try {
            const veiInfo = await this.nvdbService.getVeiInfo(
              pole.location!.coordinates[1],
              pole.location!.coordinates[0],
            );

            pole.roadNumber = veiInfo?.nummer
              ? `${veiInfo.vegkategori} ${veiInfo.nummer}`
              : 'Unknown';
          } catch (_error) {
            console.error('Error fetching road info for pole:', _error);
            pole.roadNumber = 'Unknown';
          }
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    this.loadingRoads = false;
    this.groupPoles();
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
              groupKey = pole.roadNumber || 'Unknown Road';
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
          const roadKey = pole.roadNumber || 'Unknown Road';

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
          const roadKey = pole.roadNumber || 'Unknown Road';

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

    const needsRoads = ['road', 'county_road', 'municipality_road'].includes(
      newGroupBy,
    );
    if (needsRoads && this.poles.some((p) => !p.roadNumber)) {
      this.fetchRoadNumbers();
    } else {
      this.groupPoles();
    }
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
      // If hierarchical but no sub-group selected, get all poles in parent
      Object.values(this.hierarchicalGroupedPoles[groupKey]).forEach(
        (poles) => {
          selectedPoles.push(...poles);
        },
      );
    } else {
      selectedPoles = this.groupedPoles[groupKey];
    }

    // TODO: Implement capture round creation
    const newCapture: CaptureInterface = {
      id: crypto.randomUUID(),
      groupBy: this.groupBy,
      groupKey: groupKey,
      subGroupKey: subGroupKey,
      poles: selectedPoles.map((p) => p.id),
      startDate: new Date(this.startDate).getTime(),
      endDate: new Date(this.endDate).getTime(),
      createdDate: Date.now(),
    };
    this.planCaptureService.createCapture(newCapture).subscribe({
      next: (capture) => {
        console.log('Capture round created successfully:', capture);
        this.openSnackBar('Capture round created successfully', 'Close');
      },
      error: (error) => {
        console.error('Error creating capture round:', error);
        this.openSnackBar(
          'Failed to create capture round. Please try again.',
          'Close',
        );
      },
    });
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

  switchTab(tab: 0 | 1): void {
    this.activeTab = tab;
  }

  /**
   * Display a snack bar notification
   *
   * @param message the message to display
   * @param action the action button label
   */
  openSnackBar(message: string, action: string): void {
    this._snackBar.open(message, action, {
      duration: 4 * 1000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }
}
