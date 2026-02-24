import { NgOptimizedImage } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SharedDataServiceService } from '../service/shared-data-service.service';
import * as L from 'leaflet';
import { LeafletMapComponent } from '../leaflet-map/leaflet-map.component';
import { PolesInterface } from '../interfaces/poles-interface';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PolesService } from '../service/poles.service';

@Component({
  selector: 'app-image-view',
  imports: [LeafletMapComponent, MatButtonModule, MatIconModule],
  templateUrl: './image-view.component.html',
  styleUrl: './image-view.component.scss',
})
export class ImageViewComponent {
  poleData!: PolesInterface;
  id!: string;
  cdate!: string;
  imgUrl!: string;
  private map!: L.Map;

  constructor(
    private sharedDataService: SharedDataServiceService,
    private polesService: PolesService,
    private router: Router,
    private activateRouter: ActivatedRoute,
  ) {
    // this.poleData = this.sharedDataService.getPoleData();
  }

  ngOnInit() {
    // const cdate = 20250304;
    this.activateRouter.paramMap.subscribe((params) => {
      this.cdate = params.get('cdate') || '';
      this.id = params.get('id') || '';
    });

    this.polesService.getPoleById(this.id).subscribe((pole) => {
      this.poleData = pole;
      const imageId = this.poleData?.images?.[0]?.imageId;
      if (imageId) {
        this.imgUrl =
          'http://dt14.idi.ntnu.no/RoadPolesImages/2026' +
          '/' +
          imageId +
          '.jpg';
      } else {
        console.error('No image found for pole with id:', this.id);
      }
    });

    const poleDataString = localStorage.getItem('poleData');
    this.poleData = poleDataString
      ? (JSON.parse(poleDataString) as PolesInterface)
      : ({} as PolesInterface);
  }

  navigateTo(link: string) {
    if (link == 'map') {
      this.router.navigate(['/map', this.cdate]);
    } else {
      this.router.navigate([link]);
    }
  }
}
