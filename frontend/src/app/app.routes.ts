import { Routes } from '@angular/router';

import { CalenderComponent } from './calender/calender.component';
import { ImageViewComponent } from './image-view/image-view.component';
import { InspectionEditorComponent } from './inspection-editor/inspection-editor.component';
import { ListViewComponent } from './list-view/list-view.component';
import { MapViewComponent } from './map-view/map-view.component';
import { InspectorsComponent } from './inspectors/inspectors.component';
import { PlanCaptureRoundComponent } from './plan-capture-round/plan-capture-round.component';

export const routes: Routes = [
  { path: '', component: ListViewComponent },
  { path: 'map/:cdate', component: MapViewComponent },
  { path: 'pole-details/:id', component: ImageViewComponent },
  { path: 'inspectors', component: InspectorsComponent },
  { path: 'calendar', component: CalenderComponent },
  {
    path: 'inspection/edit/:id/:imageId',
    component: InspectionEditorComponent,
  },
  { path: 'plan', component: PlanCaptureRoundComponent },
];
