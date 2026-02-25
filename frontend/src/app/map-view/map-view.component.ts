import { Component } from '@angular/core';
// import { ArcgisMapComponent } from "../arcgis-map/arcgis-map.component";
import { LeafletMapComponent } from '../leaflet-map/leaflet-map.component';
import { PolesService } from '../service/poles.service';
import { PolesInterface } from '../interfaces/poles-interface';
import { SharedDataServiceService } from '../service/shared-data-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-map-view',
  imports: [LeafletMapComponent, MatButtonModule, MatIconModule],
  providers: [PolesService],
  templateUrl: './map-view.component.html',
  styleUrl: './map-view.component.scss',
})
export class MapViewComponent {
  cdate!: string;
  poles: PolesInterface[] = [];

  constructor(
    private polesService: PolesService,
    private sharedDataService: SharedDataServiceService,
    private activateRouter: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    localStorage.removeItem('poleData');
    this.cdate = this.activateRouter.snapshot.paramMap.get('cdate') || '';
    if (this.cdate !== '') this.fetchPoles(this.cdate);
  }

  fetchPoles = async (cdate: string) => {
    this.sharedDataService.setPolesData([]);
    const capturedDate = parseInt(cdate);
    const poles = await this.polesService
      .getPolesByDate(capturedDate)
      .toPromise();
    if (poles) {
      this.sharedDataService.setPolesData(poles);
    }
  };

  navigateTo(page: string) {
    this.router.navigate([page]);
  }
}
