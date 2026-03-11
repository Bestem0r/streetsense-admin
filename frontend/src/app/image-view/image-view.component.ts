import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';
import { LeafletMapComponent } from '../leaflet-map/leaflet-map.component';
import { PolesInterface } from '../interfaces/poles-interface';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PolesService } from '../service/poles.service';

@Component({
  selector: 'app-image-view',
  imports: [LeafletMapComponent, MatButtonModule, MatIconModule, CommonModule],
  templateUrl: './image-view.component.html',
  styleUrl: './image-view.component.scss',
})
export class ImageViewComponent implements OnInit {
  poleData!: PolesInterface;
  Images: any[] = [];
  id!: string;
  cdate!: string;
  imgUrl!: string;
  selectedImage: any = null;
  private map!: L.Map;

  private polesService = inject(PolesService);
  private router = inject(Router);
  private activateRouter = inject(ActivatedRoute);

  ngOnInit() {
    this.activateRouter.paramMap.subscribe((params) => {
      this.cdate = params.get('cdate') || '';
      this.id = params.get('id') || '';
    });

    this.polesService.getPoleById(this.id).subscribe((pole) => {
      this.poleData = pole;
      this.sortImagesByDate();
      const imageId = this.Images?.[0]?.imageId;
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

  sortImagesByDate() {
    if (this.poleData?.images) {
      this.Images = [...this.poleData.images].sort(
        (a, b) => +b.capturedDate - +a.capturedDate,
      );
    }
  }

  openImage(image: any) {
    this.selectedImage = image;
  }

  closeImage() {
    this.selectedImage = null;
  }
}
