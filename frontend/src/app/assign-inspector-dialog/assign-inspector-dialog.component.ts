import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InspectorService, Inspector } from '../service/inspector.service';

@Component({
  selector: 'app-assign-inspector-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './assign-inspector-dialog.component.html',
})
export class AssignInspectorDialogComponent implements OnInit {
  @Output() selected = new EventEmitter<Inspector>();
  @Output() cancelled = new EventEmitter<void>();

  inspectors: Inspector[] = [];
  filtered: Inspector[] = [];
  query = '';
  loading = true;

  private inspectorService = inject(InspectorService);

  ngOnInit() {
    this.inspectorService.getInspectors().subscribe({
      next: (data) => {
        this.inspectors = data;
        this.filtered = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  filter() {
    const q = this.query.toLowerCase();
    this.filtered = q
      ? this.inspectors.filter(
          (i) =>
            `${i.firstName} ${i.lastName}`.toLowerCase().includes(q) ||
            i.email.toLowerCase().includes(q),
        )
      : [...this.inspectors];
  }

  getInitials(i: Inspector): string {
    return (
      ((i.firstName?.[0] ?? '') + (i.lastName?.[0] ?? '')).toUpperCase() ||
      i.email[0].toUpperCase()
    );
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
