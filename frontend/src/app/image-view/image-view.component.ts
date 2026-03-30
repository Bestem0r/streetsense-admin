import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LeafletMapComponent } from '../leaflet-map/leaflet-map.component';
import { PoleInterface } from '../interfaces/pole-interface';
import { veiSystem } from '../interfaces/vei-system';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PolesService } from '../service/poles.service';
import { NVDBService } from '../service/nvdb.service';

@Component({
  selector: 'app-image-view',
  imports: [LeafletMapComponent, MatButtonModule, MatIconModule, CommonModule],
  templateUrl: './image-view.component.html',
  styleUrl: './image-view.component.scss',
})
export class ImageViewComponent implements OnInit {
  poleData: PoleInterface | null = null;
  poles: PoleInterface[] = [];
  Images: any[] = [];
  id!: string;
  imgUrl!: string;
  selectedIndex: number | null = null;
  veiInfo: veiSystem | null = null;
  private polesService = inject(PolesService);
  private veiService = inject(NVDBService);
  private router = inject(Router);
  private activateRouter = inject(ActivatedRoute);

  async ngOnInit() {
    this.activateRouter.paramMap.subscribe((params) => {
      this.id = params.get('id') || '';
    });

    this.polesService.getPoleById(this.id).subscribe(async (pole) => {
      this.poleData = pole;

      const lat = pole?.location?.coordinates?.[1];
      const lon = pole?.location?.coordinates?.[0];

      if (lat !== undefined && lon !== undefined) {
        this.veiInfo = await this.veiService.getVeiInfo(lat, lon);
      } else {
        this.veiInfo = null;
      }

      this.poles = [pole];
      this.sortImagesByDate();

      const imageId = this.Images?.[0]?.imageId;
      if (imageId) {
        this.imgUrl =
          'http://dt14.idi.ntnu.no/RoadPolesImages/2026/' + imageId + '.jpg';
      }
    });
    const poleDataString = localStorage.getItem('poleData');
    this.poleData = poleDataString
      ? (JSON.parse(poleDataString) as PoleInterface)
      : ({} as PoleInterface);
  }

  navigateTo(link: string) {
    this.router.navigate([link]);
  }

  sortImagesByDate() {
    if (this.poleData?.images) {
      this.Images = [...this.poleData.images].sort(
        (a, b) => +b.capturedDate - +a.capturedDate,
      );
    }
  }

  openImage(index: number) {
    this.selectedIndex = index;
  }

  closeImage() {
    this.selectedIndex = null;
  }

  get selectedImage() {
    if (this.selectedIndex === null) return null;
    return this.Images[this.selectedIndex];
  }

  nextImage() {
    if (this.selectedIndex === null) return;

    this.selectedIndex = (this.selectedIndex + 1) % this.Images.length;
  }

  prevImage() {
    if (this.selectedIndex === null) return;

    this.selectedIndex =
      (this.selectedIndex - 1 + this.Images.length) % this.Images.length;
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/placeholder.svg';
  }
}
