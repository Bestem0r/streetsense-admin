import {
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';

import { PolesService } from '../service/poles.service';

@Component({
  selector: 'app-arcgis-map',
  templateUrl: './arcgis-map.component.html',
  providers: [PolesService],
  styleUrls: ['./arcgis-map.component.css'],
})
export class ArcgisMapComponent implements OnInit {
  @ViewChild('mapDiv', { static: true }) mapDiv!: ElementRef;
  map!: __esri.Map;
  mapView!: __esri.MapView;

  private polesService = inject(PolesService);

  async ngOnInit() {
    this.fetchPoles();
    this.loadStreetMap();
    // this.loadMap();
  }

  fetchPoles = async () => {
    const poles = await this.polesService.getPoles().toPromise();
    this.createPolesLayer(poles);
  };

  loadStreetMap = async () => {
    try {
      const [Map, MapView] = await Promise.all([
        import('@arcgis/core/Map').then((m) => m.default),
        import('@arcgis/core/views/MapView').then((m) => m.default),
      ]);
      this.map = new Map({
        basemap: 'streets-vector',
      });

      this.mapView = new MapView({
        container: this.mapDiv.nativeElement,
        map: this.map,
        center: [10.7522, 59.9139],
        zoom: 12,
      });
    } catch (error) {
      console.error('Error loading argis map: ', error);
    }
  };

  createPolesLayer = async (poles: any) => {
    const [FeatureLayer, Graphic] = await Promise.all([
      import('@arcgis/core/layers/FeatureLayer').then((m) => m.default),
      import('@arcgis/core/Graphic').then((m) => m.default),
    ]);

    const graphics = poles.map((pole: any) => {
      const point = {
        type: 'point',
        longitude: pole.gps.coordinates[0],
        latitude: pole.gps.coordinates[1],
      };

      const markerSymbol = {
        type: 'simple-marker',
        color: [226, 119, 40], // Orange
        outline: {
          color: [255, 255, 255], // White
          width: 1,
        },
      };

      return new Graphic({
        geometry: point as any,
        symbol: markerSymbol as any,
        attributes: pole,
      });
    });

    const polesLayer = new FeatureLayer({
      source: graphics,
      objectIdField: 'FID',
      geometryType: 'point',
      fields: [
        {
          name: 'FID',
          alias: 'FID',
          type: 'oid',
        },
      ],
      renderer: {
        type: 'simple',
        symbol: {
          type: 'simple-marker',
          color: [226, 119, 40], // Orange
          outline: {
            color: [255, 255, 255], // White
            width: 1,
          },
        },
      },
    });

    // Add the layer to the map
    this.map.add(polesLayer);
    // move the view to the first pole
    this.mapView.center = poles[0].gps.coordinates;
  };

  loadMap = async () => {
    if (typeof window === 'undefined') return; // Prevents SSR errors

    // ✅ Dynamically import ArcGIS modules
    const [
      Map,
      SceneView,
      FeatureLayer,
      Graphic,
      GraphicsLayer,
      BuildingSceneLayer,
    ] = await Promise.all([
      import('@arcgis/core/Map').then((m) => m.default),
      import('@arcgis/core/views/SceneView').then((m) => m.default), // 🌍 3D View
      import('@arcgis/core/layers/FeatureLayer').then((m) => m.default),
      import('@arcgis/core/Graphic').then((m) => m.default),
      import('@arcgis/core/layers/GraphicsLayer').then((m) => m.default),
      import('@arcgis/core/layers/BuildingSceneLayer').then((m) => m.default), // ✅ 3D Building Layer
    ]);

    const map = new Map({
      basemap: 'satellite', // 🌍 3D satellite imagery
      ground: 'world-elevation', // Adds realistic terrain
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const view = new SceneView({
      container: this.mapDiv.nativeElement,
      map: map,
      camera: {
        position: { x: 10, y: 65, z: 500000 }, // Positioned over Norway
        tilt: 45, // Angled view
      },
    });

    // 🗺️ Add a FeatureLayer to highlight Norway
    const norwayLayer = new FeatureLayer({
      url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0',
      definitionExpression: "CNTRY_NAME = 'Norway'", // Show only Norway
      opacity: 1.0,
    });
    map.add(norwayLayer);

    // 🏙️ Add a layer for city markers
    const graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);

    // 📍 Create markers for Oslo and Bergen
    const cities = [
      { name: 'Oslo', coords: [10.7522, 59.9139] },
      { name: 'Bergen', coords: [5.3221, 60.3913] },
    ];

    cities.forEach((city) => {
      const point = {
        type: 'point',
        longitude: city.coords[0],
        latitude: city.coords[1],
      };

      // ✅ Explicitly cast marker symbol as an `ObjectSymbol3DLayer` (fixes error)
      const markerSymbol: any = {
        type: 'picture-marker',
        url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/RedDot.svg', // 🔴 Red dot icon
        width: '24px',
        height: '24px',
      };

      const cityLabel: any = {
        type: 'text',
        color: 'white',
        haloColor: 'black',
        haloSize: '1px',
        text: city.name,
        xoffset: 0,
        yoffset: 25,
        font: { size: 12, weight: 'bold' },
      };

      // 📍 Add marker + text label
      graphicsLayer.addMany([
        new Graphic({ geometry: point as any, symbol: markerSymbol as any }), // ✅ Explicitly cast as `any`
        new Graphic({ geometry: point as any, symbol: cityLabel as any }), // ✅ Explicitly cast as `any`
      ]);
    });

    // 🏗️ **Add a 3D Building Layer for Oslo**
    const buildingsLayer = new BuildingSceneLayer({
      url: 'https://tiles.arcgis.com/tiles/U8Q52nv5qNiDtmHc/arcgis/rest/services/3D_Buildings_Oslo/SceneServer', // ✅ Replace with a real ArcGIS 3D buildings URL
    });
    map.add(buildingsLayer);
  };
}
