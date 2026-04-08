import { Routes } from '@angular/router';

import { CalenderComponent } from './calender/calender.component';
import { ImageViewComponent } from './image-view/image-view.component';
import { InspectionEditorComponent } from './inspection-editor/inspection-editor.component';
import { ListViewComponent } from './list-view/list-view.component';
import { MapViewComponent } from './map-view/map-view.component';

export const routes: Routes = [
  { path: '', component: ListViewComponent },
  { path: 'map/:cdate', component: MapViewComponent },
  { path: 'pole-details/:id', component: ImageViewComponent },
  { path: 'calendar', component: CalenderComponent },
  {
    path: 'inspection/edit/:id/:imageId',
    component: InspectionEditorComponent,
  },
];
