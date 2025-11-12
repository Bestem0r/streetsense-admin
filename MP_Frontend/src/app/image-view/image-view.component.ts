import { NgOptimizedImage } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SharedDataServiceService } from '../service/shared-data-service.service';
import * as L from 'leaflet';
import { LeafletMapComponent } from "../leaflet-map/leaflet-map.component";
import { PolesInterface } from '../interfaces/poles-interface';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-image-view',
  imports: [LeafletMapComponent, MatButtonModule, MatIconModule],
  templateUrl: './image-view.component.html',
  styleUrl: './image-view.component.scss'
})
export class ImageViewComponent {
  poleData!: PolesInterface;
  poleId!: string;
  cdate!: string;
  imgUrl!: string;
  private map!: L.Map;

  constructor(private sharedDataService: SharedDataServiceService, private router: Router, private activateRouter: ActivatedRoute) {
    // this.poleData = this.sharedDataService.getPoleData();
  }

  ngOnInit() {
    // const cdate = 20250304;
    this.poleId = this.activateRouter.snapshot.paramMap.get('poleId') || '';
    this.cdate = this.activateRouter.snapshot.paramMap.get('cdate') || '';
    const capturedDate = new Date(parseInt(this.cdate));
    const cdate = capturedDate.toISOString().split('T')[0].replaceAll('-', '');
    this.imgUrl = "http://dt14.idi.ntnu.no/RoadPolesImages/" + cdate + "/" + this.poleId + ".jpg";
    const poleDataString = localStorage.getItem('poleData');
    this.poleData = poleDataString ? JSON.parse(poleDataString) as PolesInterface : {} as PolesInterface;

  }


  navigateTo(link: string) {
    if (link == 'map') {
      this.router.navigate(['/map', this.cdate]);
    } else {
      this.router.navigate([link]);
    }
  }

}
