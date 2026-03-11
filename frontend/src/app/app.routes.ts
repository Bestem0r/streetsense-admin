import { Routes } from '@angular/router';
import { MapViewComponent } from './map-view/map-view.component';
import { ListViewComponent } from './list-view/list-view.component';
import { CalenderComponent } from './calender/calender.component';
import { ImageViewComponent } from './image-view/image-view.component';

export const routes: Routes = [
  { path: '', component: CalenderComponent },
  { path: 'map/:cdate', component: MapViewComponent },
  { path: 'image/:cdate/:id', component: ImageViewComponent },
  { path: 'list', component: ListViewComponent },
];
