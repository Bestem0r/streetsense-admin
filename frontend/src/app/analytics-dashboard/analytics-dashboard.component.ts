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
import { RouterModule } from '@angular/router';
import { NavComponent } from '../navbar/nav.component';
import { Chart, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';
import { PolesService, DashboardStats } from '../service/poles.service';
import { InspectorService, Inspector } from '../service/inspector.service';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, NavComponent],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.scss',
})
export class AnalyticsDashboardComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('ingestionChart') ingestionRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('countyChart') countyRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('inspectorChart') inspectorRef!: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];
  private polesService = inject(PolesService);
  private inspectorService = inject(InspectorService);

  isLoading = true;

  stats!: DashboardStats;
  totalPoles = 0;
  inspectedCount = 0;
  totalCaptureDates = 0;
  activeInspectors = 0;
  inspectionRate = 0;
  recentActivity: {
    inspectorName: string;
    inspectorId: string;
    action: string;
    poleId: string;
    county: string;
    inspectionDate: number;
  }[] = [];

  private chartsReady = false;
  private inspectorMap = new Map<string, Inspector>();

  ngOnInit(): void {
    forkJoin({
      stats: this.polesService.getDashboardStats(),
      inspectors: this.inspectorService.getInspectors(),
    }).subscribe({
      next: ({ stats, inspectors }) => {
        this.stats = stats;
        inspectors.forEach((i) => this.inspectorMap.set(i.id, i));
        this.totalPoles = stats.totalPoles;
        this.inspectedCount = stats.inspectedCount;
        this.totalCaptureDates = stats.captureDates.length;
        this.activeInspectors = inspectors.length;
        this.inspectionRate =
          stats.totalPoles > 0
            ? Math.round((stats.inspectedCount / stats.totalPoles) * 100)
            : 0;
        this.recentActivity = stats.recentInspections.map((r) => {
          const insp = this.inspectorMap.get(r.assignedInspector);
          return {
            inspectorName: insp
              ? `${insp.firstName ?? ''} ${insp.lastName ?? ''}`.trim()
              : '—',
            inspectorId: r.assignedInspector ?? '',
            action: r.action || 'Not assessed',
            poleId: r.poleId,
            county: r.county ?? '—',
            inspectionDate: r.inspectionDate,
          };
        });
        this.isLoading = false;
        if (this.chartsReady) this.buildCharts();
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  ngAfterViewInit(): void {
    this.chartsReady = true;
    if (!this.isLoading) this.buildCharts();
  }

  ngOnDestroy(): void {
    this.charts.forEach((c) => c.destroy());
  }

  private buildCharts(): void {
    setTimeout(() => {
      this.buildIngestionChart();
      this.buildStatusChart();
      this.buildCountyChart();
      this.buildInspectorChart();
    }, 50);
  }

  private buildIngestionChart(): void {
    const sorted = [...this.stats.captureDates].sort(
      (a, b) => a.capturedDate - b.capturedDate,
    );
    const last14 = sorted.slice(-14);

    const chart = new Chart(this.ingestionRef.nativeElement, {
      type: 'line',
      data: {
        labels: last14.map((d) =>
          new Date(d.capturedDate).toLocaleDateString('en-GB', {
            month: 'short',
            day: 'numeric',
          }),
        ),
        datasets: [
          {
            label: 'Poles Captured',
            data: last14.map((d) => d.count),
            borderColor: '#1739b6',
            backgroundColor: 'rgba(23,57,182,0.08)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#1739b6',
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          x: { grid: { color: '#e2e8f0' } },
          y: {
            grid: { color: '#e2e8f0' },
            beginAtZero: true,
            ticks: { precision: 0 },
          },
        },
      },
    });
    this.charts.push(chart);
  }

  private buildStatusChart(): void {
    const notInspected = this.stats.totalPoles - this.stats.inspectedCount;
    const chart = new Chart(this.statusRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Inspected', 'Not Inspected'],
        datasets: [
          {
            data: [this.stats.inspectedCount, notInspected],
            backgroundColor: ['#22c55e', '#f59e0b'],
            borderWidth: 3,
            borderColor: '#fff',
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 16, font: { size: 12 }, usePointStyle: true },
          },
        },
      },
    });
    this.charts.push(chart);
  }

  private buildCountyChart(): void {
    const chart = new Chart(this.countyRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.stats.byCounty.map((e) => e.county),
        datasets: [
          {
            label: 'Poles',
            data: this.stats.byCounty.map((e) => e.count),
            backgroundColor: 'rgba(23,57,182,0.75)',
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { color: '#e2e8f0' },
            beginAtZero: true,
            ticks: { precision: 0 },
          },
          y: { grid: { display: false } },
        },
      },
    });
    this.charts.push(chart);
  }

  private buildInspectorChart(): void {
    const withNames = this.stats.byInspector
      .map((s) => {
        const insp = this.inspectorMap.get(s.inspectorId);
        return {
          name: insp
            ? `${insp.firstName?.[0] ?? ''}. ${insp.lastName ?? ''}`.trim()
            : 'Unassigned',
          inspected: s.inspected,
          pending: s.pending,
        };
      })
      .sort((a, b) => b.inspected + b.pending - (a.inspected + a.pending));

    const chart = new Chart(this.inspectorRef.nativeElement, {
      type: 'bar',
      data: {
        labels: withNames.map((s) => s.name),
        datasets: [
          {
            label: 'Inspected',
            data: withNames.map((s) => s.inspected),
            backgroundColor: '#22c55e',
            borderRadius: 4,
            stack: 'stack',
          },
          {
            label: 'Not Inspected',
            data: withNames.map((s) => s.pending),
            backgroundColor: '#f59e0b',
            borderRadius: 4,
            stack: 'stack',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { size: 12 }, usePointStyle: true },
          },
          tooltip: { mode: 'index' },
        },
        scales: {
          x: { grid: { display: false }, stacked: true },
          y: {
            grid: { color: '#e2e8f0' },
            stacked: true,
            beginAtZero: true,
            ticks: { precision: 0 },
          },
        },
      },
    });
    this.charts.push(chart);
  }

  getActionClass(action: string): string {
    if (action === 'Not assessed')
      return 'bg-slate-50 text-slate-400 border border-slate-200';
    if (action === 'No Action needed') return 'bg-gray-100 text-gray-600';
    if (action.includes('Realign') || action.includes('Reposition'))
      return 'bg-blue-100 text-blue-700';
    if (action === 'Replace') return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-600';
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
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
}
