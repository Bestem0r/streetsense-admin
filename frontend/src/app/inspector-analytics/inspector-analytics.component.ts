import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { NavComponent } from '../navbar/nav.component';
import { InspectorService, Inspector } from '../service/inspector.service';
import { PolesService, InspectorStats } from '../service/poles.service';
import { getAvatarColor } from '../utils/avatar.utils';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-inspector-analytics',
  standalone: true,
  imports: [CommonModule, MatIconModule, NavComponent],
  templateUrl: './inspector-analytics.component.html',
  styleUrl: './inspector-analytics.component.scss',
})
export class InspectorAnalyticsComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('actionChart') actionRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('countyChart') countyRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('municipalityChart') municipalityRef!: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private inspectorService = inject(InspectorService);
  private polesService = inject(PolesService);

  inspector: Inspector | null = null;
  stats: InspectorStats | null = null;
  isLoading = true;

  totalAssigned = 0;
  inspectedCount = 0;
  pendingCount = 0;
  actionsNeeded = 0;
  actionBreakdown: { action: string; count: number }[] = [];
  recentActivity: { poleId: string; county: string; action: string; inspectionDate: number | null }[] = [];

  private chartsReady = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    forkJoin({
      inspector: this.inspectorService.getInspectorById(id),
      stats: this.polesService.getInspectorStats(id),
    }).subscribe({
      next: ({ inspector, stats }) => {
        if (!inspector) { this.router.navigate(['/inspectors']); return; }
        this.inspector = inspector;
        this.stats = stats;
        this.computeStats(stats);
        this.isLoading = false;
        if (this.chartsReady) this.buildCharts();
      },
      error: () => { this.isLoading = false; },
    });
  }

  ngAfterViewInit(): void {
    this.chartsReady = true;
    if (!this.isLoading && this.inspector) this.buildCharts();
  }

  ngOnDestroy(): void {
    this.charts.forEach((c) => c.destroy());
  }

  goBack(): void { this.router.navigate(['/inspectors']); }

  getInitials(f?: string, l?: string): string {
    return ((f?.[0] ?? '') + (l?.[0] ?? '')).toUpperCase();
  }

  getAvatarColor(id: string): string { return getAvatarColor(id); }

  private computeStats(stats: InspectorStats): void {
    this.totalAssigned = stats.totalAssigned;
    this.inspectedCount = stats.inspectedCount;
    this.pendingCount = stats.totalAssigned - stats.inspectedCount;

    const actionable = stats.byAction.filter(
      (a) => a.action && a.action !== 'No Action needed' && a.action !== 'Not Inspected'
    );
    this.actionsNeeded = actionable.reduce((sum, a) => sum + a.count, 0);
    this.actionBreakdown = actionable.sort((a, b) => b.count - a.count);

    this.recentActivity = stats.recentActivity;
  }

  private buildCharts(): void {
    setTimeout(() => {
      this.buildActionChart();
      this.buildCountyChart();
      this.buildMunicipalityChart();
    }, 50);
  }

  private readonly ACTION_COLORS: Record<string, string> = {
    'Not Inspected': '#e2e8f0',
    'No Action needed': '#22c55e',
    'Replace': '#ef4444',
    'Reposition/Realign': '#3b82f6',
  };

  private buildActionChart(): void {
    const labels = this.stats!.byAction.map((a) => a.action);
    const data = this.stats!.byAction.map((a) => a.count);
    const colors = labels.map((l) => this.ACTION_COLORS[l] ?? '#94a3b8');

    const chart = new Chart(this.actionRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors, borderWidth: 3, borderColor: '#fff', hoverOffset: 6 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { position: 'bottom', labels: { padding: 14, font: { size: 11 }, usePointStyle: true } },
        },
      },
    });
    this.charts.push(chart);
  }

  private buildCountyChart(): void {
    const chart = new Chart(this.countyRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.stats!.byCounty.map((e) => e.county),
        datasets: [{
          label: 'Poles',
          data: this.stats!.byCounty.map((e) => e.count),
          backgroundColor: 'rgba(23,57,182,0.75)',
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#e2e8f0' }, beginAtZero: true, ticks: { precision: 0 } },
          y: { grid: { display: false } },
        },
      },
    });
    this.charts.push(chart);
  }

  private buildMunicipalityChart(): void {
    const chart = new Chart(this.municipalityRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.stats!.byMunicipality.map((e) => e.municipality),
        datasets: [{
          label: 'Poles',
          data: this.stats!.byMunicipality.map((e) => e.count),
          backgroundColor: 'rgba(14,116,144,0.75)',
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#e2e8f0' }, beginAtZero: true, ticks: { precision: 0 } },
          y: { grid: { display: false } },
        },
      },
    });
    this.charts.push(chart);
  }

  getActionClass(action: string): string {
    if (action === 'Not assessed') return 'bg-slate-50 text-slate-400 border border-slate-200';
    if (action === 'No Action needed') return 'bg-slate-100 text-slate-600';
    if (action.includes('Missing')) return 'bg-amber-100 text-amber-700';
    if (action.includes('Realign') || action.includes('Reposition')) return 'bg-blue-100 text-blue-700';
    if (action === 'Replace' || action.includes('Damaged') || action.includes('Replacement')) return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-600';
  }
}
