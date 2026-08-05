import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PoleInterface } from '../interfaces/pole-interface';
import { veiSystem } from '../interfaces/vei-system';
import { LeafletMapComponent } from '../leaflet-map/leaflet-map.component';
import { NavComponent } from '../navbar/nav.component';
import { PolesService } from '../service/poles.service';
import { InspectorService, Inspector } from '../service/inspector.service';
import { NvdbService, AadtResult } from '../service/nvdb.service';

@Component({
  selector: 'app-image-view',
  imports: [
    LeafletMapComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    CommonModule,
    DecimalPipe,
    NavComponent,
    RouterLink,
  ],
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
  assignedInspector: Inspector | null = null;
  aadt: AadtResult | null = null;
  aadtLoading = false;
  readonly today = Date.now();
  private polesService = inject(PolesService);
  private inspectorService = inject(InspectorService);
  private nvdbService = inject(NvdbService);

  private activateRouter = inject(ActivatedRoute);

  async ngOnInit() {
    this.activateRouter.paramMap.subscribe((params) => {
      this.id = params.get('id') || '';
    });

    this.polesService.getPoleById(this.id).subscribe(async (pole) => {
      this.poleData = pole;
      this.poles = [pole];
      this.sortImagesByDate();

      if (pole.assignedInspector) {
        this.inspectorService
          .getInspectorById(pole.assignedInspector)
          .subscribe((inspector) => {
            this.assignedInspector = inspector ?? null;
          });
      }

      const imageId = this.Images?.[0]?.imageId;
      if (imageId) {
        this.imgUrl =
          'http://dt14.idi.ntnu.no/RoadPolesImages/2026/' + imageId + '.jpg';
      }

      const coords = pole.location?.coordinates;
      if (coords) {
        this.aadtLoading = true;
        this.nvdbService.getAadt(coords[1], coords[0]).subscribe((result) => {
          this.aadt = result;
          this.aadtLoading = false;
        });
      }
    });
    const poleDataString = localStorage.getItem('poleData');
    this.poleData = poleDataString
      ? (JSON.parse(poleDataString) as PoleInterface)
      : ({} as PoleInterface);
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
