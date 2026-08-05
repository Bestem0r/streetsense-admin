import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import * as L from 'leaflet';
import 'leaflet-draw';
import { PoleInterface } from '../interfaces/pole-interface';
import { CreateCaptureDialogComponent } from '../create-capture-dialog/create-capture-dialog.component';
import { AssignInspectorDialogComponent } from '../assign-inspector-dialog/assign-inspector-dialog.component';
import { NotificationService } from '../service/notification.service';
import { PolesService } from '../service/poles.service';
import { Inspector } from '../service/inspector.service';

@Component({
  selector: 'app-leaflet-map',
  standalone: true,
  imports: [NgClass, AssignInspectorDialogComponent],
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
  private activeToolbar: L.Marker | null = null;
  private drawnItems = new L.FeatureGroup();
  private drawHandler: any = null;
  private justFinishedDraw = false;
  private tileLayers: Record<string, L.TileLayer> = {};

  @Output() captureCreated = new EventEmitter<void>();

  private notificationService = inject(NotificationService);
  private polesService = inject(PolesService);

  selectedPoles = new Set<string>();
  markerCoordinates: number[][] = [];
  drawingActive = false;
  hasSelection = false;
  showLayerMenu = false;
  activeLayer = 'Kartverket';
  readonly layerNames = ['Kartverket', 'OpenStreetMap', 'Satellite'];
  selectionCount = 0;
  toolbarPos = { x: 0, y: 0 };
  showSelectionActions = false;
  showAssignDialog = false;
  cdate!: string;

  private dialog = inject(MatDialog);
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
      maxZoom: 19,
      zoomControl: false,
    });

    this.markerLayer.addTo(this.map);
    this.map.addLayer(this.drawnItems);

    this.tileLayers = {
      Kartverket: L.tileLayer(
        'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png',
        {
          attribution:
            '&copy; <a href="http://www.kartverket.no/">Kartverket</a>',
        },
      ),
      OpenStreetMap: L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        },
      ),
      Satellite: L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles © Esri' },
      ),
    };

    this.tileLayers['Kartverket'].addTo(this.map);
    L.control.scale().setPosition('bottomright').addTo(this.map);

    this.map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      this.drawnItems.clearLayers();
      this.drawnItems.addLayer(layer);
      this.drawingActive = false;
      this.hasSelection = true;
      this.justFinishedDraw = true;
      setTimeout(() => { this.justFinishedDraw = false; }, 100);
      this.handleBoxSelection(layer.getBounds());
    });

    this.map.on(L.Draw.Event.DRAWSTOP, () => {
      this.drawingActive = false;
    });

    this.drawnItems.on('layerremove', () => {
      this.selectedPoles.clear();
      this.hasSelection = false;
      this.addMarkers(this.poles);
      this.removeToolbar();
    });

    this.map.on('click', () => {
      if (!this.justFinishedDraw) this.removeToolbar();
    });

    this.cdate = this.activateRouter.snapshot.paramMap.get('cdate') || '';

    if (this.poles.length > 0) {
      this.addMarkers(this.poles);
    }
  }

  zoomIn() {
    this.map?.zoomIn();
  }
  zoomOut() {
    this.map?.zoomOut();
  }

  setLayer(name: string) {
    if (!this.map || name === this.activeLayer) {
      this.showLayerMenu = false;
      return;
    }
    this.map.removeLayer(this.tileLayers[this.activeLayer]);
    this.tileLayers[name].addTo(this.map);
    this.activeLayer = name;
    this.showLayerMenu = false;
  }

  toggleDrawMode() {
    if (this.drawingActive) {
      this.drawHandler?.disable();
      this.drawHandler = null;
      this.drawingActive = false;
      return;
    }
    this.drawHandler = new (L.Draw as any).Rectangle(this.map, {
      showArea: false,
      shapeOptions: { color: '#ff7800', weight: 1 },
      metric: false,
    });
    this.drawHandler.enable();
    this.drawingActive = true;
  }

  clearSelection() {
    this.drawnItems.clearLayers();
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

    if (this.selectedPoles.size > 0) {
      this.showSelectionToolbar(bounds, this.selectedPoles.size);
    } else {
      this.drawnItems.clearLayers();
      this.hasSelection = false;
    }
  }

  private showSelectionToolbar(bounds: L.LatLngBounds, count: number) {
    const center = bounds.getCenter();
    const pt = this.map.latLngToContainerPoint(center);
    this.toolbarPos = { x: pt.x, y: pt.y };
    this.selectionCount = count;
    this.showSelectionActions = true;
  }

  planNewCapture() {
    const ref = this.dialog.open(CreateCaptureDialogComponent, {
      data: { poleIds: Array.from(this.selectedPoles) },
      disableClose: false,
    });
    ref.afterClosed().subscribe((created) => {
      if (created) {
        this.captureCreated.emit();
        this.notificationService.refresh();
      }
    });
    this.showSelectionActions = false;
  }

  get assignInspectorLabel(): string {
    const selected = this.poles.filter((p) => this.selectedPoles.has(p.id));
    return selected.length > 0 && selected.every((p) => p.assignedInspector)
      ? 'Change Inspector'
      : 'Assign Inspector';
  }

  assignToInspector() {
    this.showAssignDialog = true;
    this.showSelectionActions = false;
  }

  onInspectorSelected(inspector: Inspector) {
    this.showAssignDialog = false;
    const ids = Array.from(this.selectedPoles);
    ids.forEach((id) => {
      const pole = this.poles.find((p) => p.id === id);
      if (!pole) return;
      this.polesService
        .updatePole({ ...pole, assignedInspector: inspector.id })
        .subscribe();
    });
    this.clearSelection();
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
    this.showSelectionActions = false;
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
