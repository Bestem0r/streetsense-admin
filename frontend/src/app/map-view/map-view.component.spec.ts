import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { MapViewComponent } from './map-view.component';

vi.mock('leaflet', () => {
  const stub = () => {
    const self: any = {
      addTo: vi.fn(() => self),
      setPosition: vi.fn(() => self),
      addLayer: vi.fn(() => self),
      removeLayer: vi.fn(() => self),
      clearLayers: vi.fn(() => self),
      on: vi.fn(() => self),
      off: vi.fn(() => self),
      addControl: vi.fn(() => self),
      remove: vi.fn(() => self),
      fitBounds: vi.fn(() => self),
      setView: vi.fn(() => self),
      getLatLng: vi.fn(() => ({ lat: 0, lng: 0 })),
      bindPopup: vi.fn(() => self),
      openPopup: vi.fn(() => self),
      setIcon: vi.fn(() => self),
      getBounds: vi.fn(() => ({ toBBoxString: () => '' })),
    };
    return self;
  };
  function FeatureGroup() {
    return stub();
  }
  function DrawControl() {
    return stub();
  }
  const L = {
    map: vi.fn(stub),
    layerGroup: vi.fn(stub),
    featureGroup: vi.fn(stub),
    FeatureGroup,
    icon: vi.fn(() => ({})),
    tileLayer: vi.fn(stub),
    marker: vi.fn(stub),
    control: { layers: vi.fn(stub), scale: vi.fn(stub) },
    Control: { extend: vi.fn(), Draw: DrawControl },
    Draw: {
      Event: {
        CREATED: 'draw:created',
        DELETED: 'draw:deleted',
        EDITED: 'draw:edited',
      },
    },
  };
  return { ...L, default: L };
});
vi.mock('leaflet-draw', () => ({ default: {} }));

describe('MapViewComponent', () => {
  let component: MapViewComponent;
  let fixture: ComponentFixture<MapViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapViewComponent],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MapViewComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
