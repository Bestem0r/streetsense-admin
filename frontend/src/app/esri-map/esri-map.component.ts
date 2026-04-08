import { Component, OnInit } from '@angular/core';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';

@Component({
  selector: 'app-esri-map',
  imports: [],
  templateUrl: './esri-map.component.html',
  styleUrl: './esri-map.component.scss',
})
export class EsriMapComponent implements OnInit {
  ngOnInit(): void {
    this.loadMap();
  }

  loadMap = async () => {
    // Initialize the map and view
    const map = new Map({
      basemap: 'streets',
    });

    const view = new MapView({
      container: 'mapViewDiv', // ID of the HTML element to host the map
      map: map,
      center: [10.7522, 59.9139], // Longitude, latitude
      zoom: 12, // Zoom level
    });

    // Create a graphics layer to hold the markers
    const graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);

    // Define the markers with their coordinates, titles, and content
    const markers = [
      {
        longitude: 10.7522,
        latitude: 59.9139,
        title: 'Marker 1',
        content: 'This is marker 1.',
      },
      {
        longitude: 10.6855,
        latitude: 59.8343,
        title: 'Marker 2',
        content: 'This is marker 2.',
      },
    ];

    // Add each marker to the graphics layer
    markers.forEach((marker) => {
      const point = {
        type: 'point',
        longitude: marker.longitude,
        latitude: marker.latitude,
      };

      const simpleMarkerSymbol = {
        type: 'simple-marker',
        color: [226, 119, 40], // orange
        outline: {
          color: [255, 255, 255], // white
          width: 1,
        },
      };

      const pointGraphic = new Graphic({
        geometry: point as any,
        symbol: simpleMarkerSymbol as any,
        popupTemplate: {
          title: marker.title,
          content: marker.content,
        },
      });

      graphicsLayer.add(pointGraphic);
    });

    view.on('click', async (event) => {
      view.hitTest(event).then((response: any) => {
        if (response.results.length) {
          const graphic = response.results.filter((result: any) => {
            return result.graphic.layer === graphicsLayer;
          })[0].graphic;

          view?.openPopup({
            title: 'poles',
            content: 'testing popup',
            location: graphic.geometry,
          });
        }
      });
    });
  };
}
