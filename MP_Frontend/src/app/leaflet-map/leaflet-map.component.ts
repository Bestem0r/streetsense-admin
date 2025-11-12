import { AfterViewInit, Component, input, Input } from '@angular/core';
import * as L from 'leaflet';
import { PolesInterface } from '../interfaces/poles-interface';
import { SharedDataServiceService } from '../service/shared-data-service.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-leaflet-map',
  imports: [],
  templateUrl: './leaflet-map.component.html',
  styleUrl: './leaflet-map.component.scss',
})
export class LeafletMapComponent implements AfterViewInit {
  poleData!: any;
  markerCoordinates: number[][] = [];
  cdate!: string;
  poles: PolesInterface[] = [];
  private map: any;
  markerIcon = L.icon({
    iconUrl: 'assets/marker_pink.png',
    iconSize: [20, 20],
    iconAnchor: [13, 20],
  });

  constructor(
    private sharedDataService: SharedDataServiceService,
    private router: Router,

    private activateRouter: ActivatedRoute
  ) {}

  // test
  ngOnInit() {}

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    // Check if the map is already initialized
    if (this.map) {
      console.warn('Map container is already initialized.');
      return;
    }

    this.map = L.map('mymap', {
      center: [59.9139, 10.7522],
      zoom: 12,
    });

    const tiles = L.tileLayer(
      'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png',
      {
        attribution:
          '&copy; <a href="http://www.kartverket.no/">Kartverket</a>',
      }
    );
    const osmTiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );

    this.map.addLayer(tiles);

    const baseMaps = {
      Kartverket: tiles,
      OpenStreetMap: osmTiles,
    };

    this.map
      .addControl(new L.Control.Layers(baseMaps).setPosition('topleft'))
      .addControl(new L.Control.Scale().setPosition('bottomright'));

    const poleDataString = localStorage.getItem('poleData');
    this.poleData = poleDataString
      ? (JSON.parse(poleDataString) as PolesInterface)
      : { poleId: '' };

    const routeParam = this.activateRouter.snapshot.url.findIndex(
      (e) => e.path == 'map'
    );
    this.cdate = this.activateRouter.snapshot.paramMap.get('cdate') || '';
    if (routeParam !== -1) this.fetchPoleData();
    else this.addPoleMarker();
  }

  private fetchPoleData() {
    this.sharedDataService
      .getPolesData()
      .subscribe((poles: PolesInterface[]) => {
        this.poles = poles;
        this.addMarkers(poles);
      });
  }

  async addPoleMarker() {
    const lat = this.poleData.lat;
    const lng = this.poleData.lng;
    const popupMsg = await this.getPopupMsg();
    L.marker([lat, lng], { icon: this.markerIcon })
      .bindPopup(popupMsg)
      .addTo(this.map);
    this.map.setView([lat, lng], 17);
  }

  private getPopupMsg() {
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.poleData.popupContent, 'text/html');
    const eleToRemove = doc.getElementsByClassName('imgBlock');
    const eleBtn = doc.getElementsByClassName('viewImgBtn');
    if (eleToRemove.length > 0) {
      const parentEle = eleToRemove[0].parentNode;
      parentEle?.removeChild(eleToRemove[0]);
    }
    if (eleBtn.length > 0) {
      const parentEle = eleBtn[0].parentNode;
      parentEle?.removeChild(eleBtn[0]);
    }
    const popupMsg = doc.body.innerHTML;
    return popupMsg;
  }

  private async addMarkers(poles: PolesInterface[]) {
    if (poles.length > 0) {
      poles.forEach((pole: PolesInterface) => {
        if (
          pole.location?.coordinates &&
          pole.location?.coordinates.length > 1
        ) {
          const latitude = parseFloat(pole.location?.coordinates[1].toFixed(5));
          const longitude = parseFloat(
            pole.location?.coordinates[0].toFixed(5)
          );
          this.markerCoordinates.push([latitude, longitude]);
          var marker = L.marker([latitude, longitude], {
            icon: this.markerIcon,
          });
          (marker as any).id = pole.poleId;
          const cdate = pole.capturedDate?.split('-').join('');
          const imgUrl =
            'http://dt14.idi.ntnu.no/RoadPolesImages/' +
            cdate +
            '/' +
            pole.poleId +
            '.jpg';
          const popupMsg =
            ' <p class="imgBlock"> <img src="' +
            imgUrl +
            '" width=100 /> </p> <br> <div>' +
            '<p>PoleId: ' +
            pole.poleId +
            '</p>' +
            '<p>Latitude: ' +
            latitude +
            '</p>' +
            '<p>Longitude: ' +
            longitude +
            '</p>' +
            '<p>Speed: ' +
            pole.speed +
            '</p>' +
            '<p> Altitude: ' +
            pole.altitude +
            '</p>' +
            '<p> Fixtype: ' +
            pole.fixType +
            '</p>' +
            '<p> CourseOverGround: ' +
            pole.courseOverGround +
            '</p>' +
            '<p> hdop: ' +
            pole.hdop +
            '</p>' +
            '<button class="viewImgBtn">View Image</button>';
          ('</div>');
          marker
            .addTo(this.map)
            .bindPopup(popupMsg)
            .on('popupopen', (a) => {
              var popUp = a.target.getPopup();
              popUp
                .getElement()
                .querySelector('.viewImgBtn')
                .addEventListener('click', (e: any) => {
                  console.log(popUp._content);
                  this.viewImage(a.target.id, a.target._latlng, popUp._content);
                });
            });
        } else {
          console.warn('Invalid GPS coordinates for pole:', pole);
        }
      });
      if (this.markerCoordinates.length > 0)
        this.map.setView(this.markerCoordinates[0], 13);
    }
  }

  viewImage(poleId: string, coordinates: L.LatLng, popupContent: string) {
    this.router.navigate(['/image', this.cdate, poleId]);
    const poleData = {
      poleId: poleId,
      lat: coordinates.lat,
      lng: coordinates.lng,
      popupContent: popupContent,
    };
    localStorage.setItem('poleData', JSON.stringify(poleData));
    this.sharedDataService.setPoleData({
      poleId: poleId,
      location: {
        type: 'Point',
        coordinates: [coordinates.lat, coordinates.lng],
      },
    });
  }

  ngOnDestroy(): void {
    // Properly destroy the map instance
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }
}
