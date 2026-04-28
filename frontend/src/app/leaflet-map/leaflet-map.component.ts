import {
  AfterViewInit,
  Component,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';
import 'leaflet-draw';

import { PoleInterface } from '../interfaces/pole-interface';

@Component({
  selector: 'app-leaflet-map',
  standalone: true,
  templateUrl: './leaflet-map.component.html',
  styleUrl: './leaflet-map.component.scss',
})
export class LeafletMapComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() poles: PoleInterface[] = [];
  @Input() focusedPole: string | null = null;

  private map: any;
  private markerLayer = L.layerGroup();
  private markers = new Map<string, L.Marker>();
  private activeToolbar: L.Marker | null = null;

  selectedPoles = new Set<string>();
  markerCoordinates: number[][] = [];
  cdate!: string;

  private router = inject(Router);
  private activateRouter = inject(ActivatedRoute);

  markerIcon = L.icon({
    iconUrl: 'assets/marker_pink.png',
    iconSize: [20, 20],
    iconAnchor: [13, 20],
  });

  markerGreenIcon = L.icon({
    iconUrl: 'assets/marker.png',
    iconSize: [20, 20],
    iconAnchor: [13, 20],
  });

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['poles'] && this.map && this.poles.length > 0) {
      this.addMarkers(this.poles);
    }
    if (changes['focusedPole'] && this.map) {
      this.addMarkers(this.poles);
    }
  }

  private initMap(): void {
    if (this.map) return;

    this.map = L.map('mymap', {
      center: [59.9139, 10.7522],
      zoom: 12,
    });

    this.markerLayer.addTo(this.map);

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

    const satelliteTiles = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles © Esri',
      },
    );

    kartverketTiles.addTo(this.map);

    L.control
      .layers({
        Kartverket: kartverketTiles,
        OpenStreetMap: osmTiles,
        Satellite: satelliteTiles,
      })
      .setPosition('topleft')
      .addTo(this.map);

    L.control.scale().setPosition('bottomright').addTo(this.map);

    const drawnItems = new L.FeatureGroup();
    this.map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      draw: {
        rectangle: {
          showArea: false,
          shapeOptions: {
            color: '#ff7800',
            weight: 1,
          },
          metric: false,
        },
        polygon: false,
        polyline: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        edit: false,
        remove: true,
      },
    });

    this.map.addControl(drawControl);

    this.map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItems.clearLayers();
      drawnItems.addLayer(layer);

      const bounds = layer.getBounds();
      this.handleBoxSelection(bounds);
    });

    drawnItems.on('layerremove', () => {
      this.selectedPoles.clear();
      this.addMarkers(this.poles);
      this.removeToolbar();
    });

    this.map.on('click', () => {
      this.removeToolbar();
    });

    this.cdate = this.activateRouter.snapshot.paramMap.get('cdate') || '';

    if (this.poles.length > 0) {
      this.addMarkers(this.poles);
    }
  }

  handleBoxSelection(bounds: L.LatLngBounds) {
    this.selectedPoles.clear();

    this.poles.forEach((pole) => {
      if (pole.location?.coordinates) {
        const lat = pole.location.coordinates[1];
        const lng = pole.location.coordinates[0];

        if (bounds.contains(L.latLng(lat, lng))) {
          this.selectedPoles.add(pole.id);
        }
      }
    });

    this.removeToolbar();
    this.addMarkers(this.poles);
  }

  private addMarkers(poles: PoleInterface[]) {
    this.markerLayer.clearLayers();
    this.markerCoordinates = [];

    let focusedCoords: number[] | null = null;

    poles.forEach((pole) => {
      if (!pole.location?.coordinates) return;

      const lat = pole.location.coordinates[1];
      const lng = pole.location.coordinates[0];

      const isSelected = this.selectedPoles.has(pole.id);
      const isFocused = pole.id === this.focusedPole;

      const marker = L.marker([lat, lng], {
        icon: isSelected || isFocused ? this.markerGreenIcon : this.markerIcon,
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        this.showToolbar(marker, pole);
      });

      marker.addTo(this.markerLayer);

      if (isFocused) {
        focusedCoords = [lat, lng];
      }

      this.markerCoordinates.push([lat, lng]);
    });

    if (focusedCoords) {
      this.map.flyTo(focusedCoords, 16);
    } else if (this.markerCoordinates.length > 0) {
      this.map.flyTo(this.markerCoordinates[0], 13);
    }
  }

  private showToolbar(marker: L.Marker, pole: PoleInterface) {
    this.removeToolbar();

    const latLng = marker.getLatLng();

    const html = `
      <div class="marker-toolbar" id="toolbar-${pole.id}">
        <button class="btn-view">Details</button>
        <button class="btn-select">
          ${this.selectedPoles.has(pole.id) ? 'Unselect' : 'Select'}
        </button>
        <button class="btn-close">✕</button>
      </div>
    `;

    const icon = L.divIcon({
      html,
      className: '',
      iconSize: [160, 40],
      iconAnchor: [80, 50],
    });

    const toolbar = L.marker(latLng, {
      icon,
      interactive: true,
    });

    toolbar.addTo(this.map);
    this.activeToolbar = toolbar;

    setTimeout(() => {
      const el = document.getElementById(`toolbar-${pole.id}`);
      if (!el) return;

      el.querySelector('.btn-view')?.addEventListener('click', () => {
        this.viewImage(pole.id);
      });

      el.querySelector('.btn-select')?.addEventListener('click', () => {
        this.toggleSelection(pole.id);
      });

      el.querySelector('.btn-close')?.addEventListener('click', () => {
        this.removeToolbar();
      });
    });
  }

  private removeToolbar() {
    if (this.activeToolbar) {
      this.map.removeLayer(this.activeToolbar);
      this.activeToolbar = null;
    }
  }

  private toggleSelection(id: string) {
    if (this.selectedPoles.has(id)) {
      this.selectedPoles.delete(id);
    } else {
      this.selectedPoles.add(id);
    }

    this.addMarkers(this.poles);
  }

  viewImage(id: string) {
    this.router.navigate(['/pole-details', id]);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }
}
