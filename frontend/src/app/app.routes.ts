import { Routes } from '@angular/router';
import { MapViewComponent } from './map-view/map-view.component';
import { ListViewComponent } from './list-view/list-view.component';
import { CalenderComponent } from './calender/calender.component';
import { ImageViewComponent } from './image-view/image-view.component';

export const routes: Routes = [
  { path: '', component: ListViewComponent },
  { path: 'map/:cdate', component: MapViewComponent },
  { path: 'pole-details/:id', component: ImageViewComponent },
  { path: 'calender', component: CalenderComponent },
];
