import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  inject,
} from '@angular/core';
import * as L from 'leaflet';
import { PolesInterface } from '../interfaces/poles-interface';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-leaflet-map',
  standalone: true,
  templateUrl: './leaflet-map.component.html',
  styleUrl: './leaflet-map.component.scss',
})
export class LeafletMapComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() poles: PolesInterface[] = [];

  private map: any;
  markerCoordinates: number[][] = [];
  cdate!: string;

  markerIcon = L.icon({
    iconUrl: 'assets/marker_pink.png',
    iconSize: [20, 20],
    iconAnchor: [13, 20],
    popupAnchor: [0, -20],
  });

  private router = inject(Router);
  private activateRouter = inject(ActivatedRoute);

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['poles'] && this.map && this.poles.length > 0) {
      this.addMarkers(this.poles);
    }
  }

  private initMap(): void {
    if (this.map) return;

    this.map = L.map('mymap', {
      center: [59.9139, 10.7522],
      zoom: 12,
    });

    const kartverketTiles = L.tileLayer(
      'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png',
      {
        attribution:
          '&copy; <a href="http://www.kartverket.no/">Kartverket</a>',
      },
    );

    const osmTiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    );

    kartverketTiles.addTo(this.map);

    const baseMaps = {
      Kartverket: kartverketTiles,
      OpenStreetMap: osmTiles,
    };

    L.control.layers(baseMaps).setPosition('topleft').addTo(this.map);
    L.control.scale().setPosition('bottomright').addTo(this.map);

    this.cdate = this.activateRouter.snapshot.paramMap.get('cdate') || '';

    if (this.poles.length > 0) {
      this.addMarkers(this.poles);
    }
  }

  private addMarkers(poles: PolesInterface[]) {
    this.markerCoordinates = [];

    poles.forEach((pole: PolesInterface) => {
      if (pole.location?.coordinates && pole.location.coordinates.length > 1) {
        const latitude = parseFloat(pole.location.coordinates[1].toFixed(5));

        const longitude = parseFloat(pole.location.coordinates[0].toFixed(5));

        const latestImage = pole.images?.reduce((latest, current) => {
          return new Date(current.capturedDate) > new Date(latest.capturedDate)
            ? current
            : latest;
        });

        this.markerCoordinates.push([latitude, longitude]);

        const marker = L.marker([latitude, longitude], {
          icon: this.markerIcon,
        });

        (marker as any).id = pole.id;

        const imgUrl =
          'http://dt14.idi.ntnu.no/RoadPolesImages/2026/' +
          latestImage?.imageId +
          '.jpg';

        const popupMsg = `
          <div class="popup-card">
            <div class="imgBlock">
              <img src="${imgUrl}" />
            </div>

            <div class="info">
              <p><b>ID:</b> ${pole.id}</p>
              <p><b>Latest Inspection:</b> ${latestImage?.capturedDate}</p>
              <p><b>Lat:</b> ${latitude}</p>
              <p><b>Long:</b> ${longitude}</p>
              <p><b>Speed:</b> ${pole.speed}</p>
              <p><b>Altitude:</b> ${pole.altitude}</p>
              <p><b>Fix:</b> ${pole.fixType}</p>
              <p><b>HDOP:</b> ${pole.hdop}</p>

              <button class="viewImgBtn w-full bg-gray-500 hover:bg-gray-700 font-bold text-white py-2 px-4 rounded">
                View Inspection History
              </button>
            </div>
          </div>
        `;

        marker
          .addTo(this.map)
          .bindPopup(popupMsg)
          .on('popupopen', (event) => {
            const popup = event.target.getPopup();

            popup
              .getElement()
              .querySelector('.viewImgBtn')
              ?.addEventListener('click', () => {
                this.viewImage(event.target.id);
              });
          });
      }
    });

    if (this.markerCoordinates.length > 0) {
      this.map.setView(this.markerCoordinates[0], 13);
    }
  }

  viewImage(id: string) {
    this.router.navigate(['/image', this.cdate, id]);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }
}
