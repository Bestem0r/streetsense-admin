import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { map } from 'rxjs';
import { MapViewComponent } from './map-view/map-view.component';
import { HomeComponent } from './home/home.component';
import { ListViewComponent } from './list-view/list-view.component';
import { CalenderComponent } from './calender/calender.component';
import { ImageViewComponent } from './image-view/image-view.component';

export const routes: Routes = [
  { path: '', component: CalenderComponent },
  { path: 'map/:cdate', component: MapViewComponent },
  { path: 'image/:cdate/:id', component: ImageViewComponent },
  { path: 'list', component: ListViewComponent },
];
