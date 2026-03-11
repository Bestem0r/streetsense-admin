import { Component, inject, Input, OnInit } from '@angular/core';
import { LeafletMapComponent } from '../leaflet-map/leaflet-map.component';
import { PolesService } from '../service/poles.service';
import { PolesInterface } from '../interfaces/poles-interface';
import { SharedDataServiceService } from '../service/shared-data-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [LeafletMapComponent, MatButtonModule, MatIconModule],
  providers: [PolesService],
  templateUrl: './map-view.component.html',
  styleUrl: './map-view.component.scss',
})
export class MapViewComponent implements OnInit {
  @Input() poles: PolesInterface[] = [];
  cdate!: string;
  private polesService = inject(PolesService);
  private sharedDataService = inject(SharedDataServiceService);
  private activateRouter = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit() {
    localStorage.removeItem('poleData');

    this.cdate = this.activateRouter.snapshot.paramMap.get('cdate') || '';

    // If route contains a date → fetch poles from API
    if (this.cdate !== '') {
      this.fetchPoles(this.cdate);
    }
    // Otherwise use poles passed from parent component
    else if (this.poles.length > 0) {
      this.sharedDataService.setPolesData(this.poles);
    }
  }

  fetchPoles = async (cdate: string) => {
    this.sharedDataService.setPolesData([]);

    const capturedDate = parseInt(cdate);

    try {
      const poles = await this.polesService
        .getPolesByDate(capturedDate)
        .toPromise();

      if (poles) {
        this.sharedDataService.setPolesData(poles);
      }
    } catch (error) {
      console.error('Error fetching poles:', error);
    }
  };

  navigateTo(page: string) {
    this.router.navigate([page]);
  }
}
