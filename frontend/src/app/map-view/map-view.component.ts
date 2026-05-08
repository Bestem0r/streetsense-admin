import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';

import { PoleInterface } from '../interfaces/pole-interface';
import { LeafletMapComponent } from '../leaflet-map/leaflet-map.component';
import { PolesService } from '../service/poles.service';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [LeafletMapComponent, MatButtonModule, MatIconModule],
  providers: [PolesService],
  templateUrl: './map-view.component.html',
  styleUrl: './map-view.component.scss',
})
export class MapViewComponent implements OnInit {
  @Input() poles: PoleInterface[] = [];
  @Input() focusedPole: string | null = null;
  @Output() captureCreated = new EventEmitter<void>();
  cdate!: string;
  private activateRouter = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit() {
    localStorage.removeItem('poleData');
    this.cdate = this.activateRouter.snapshot.paramMap.get('cdate') || '';
  }
}
