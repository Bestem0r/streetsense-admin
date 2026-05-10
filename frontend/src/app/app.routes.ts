import { Routes } from '@angular/router';

import { CalenderComponent } from './calender/calender.component';
import { ImageViewComponent } from './image-view/image-view.component';
import { InspectionEditorComponent } from './inspection-editor/inspection-editor.component';
import { ListViewComponent } from './list-view/list-view.component';
import { MapViewComponent } from './map-view/map-view.component';
import { InspectorsComponent } from './inspectors/inspectors.component';
import { PlanCaptureRoundComponent } from './plan-capture-round/plan-capture-round.component';
import { LoginComponent } from './login/login.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { AuthGuard } from './guards/auth.guard';
import { AnalyticsDashboardComponent } from './analytics-dashboard/analytics-dashboard.component';
import { InspectorAnalyticsComponent } from './inspector-analytics/inspector-analytics.component';
import { SettingsComponent } from './settings/settings.component';

export const routes: Routes = [
  { path: '', component: ListViewComponent, canActivate: [AuthGuard] },
  { path: 'map/:cdate', component: MapViewComponent, canActivate: [AuthGuard] },
  {
    path: 'pole-details/:id',
    component: ImageViewComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'inspectors',
    component: InspectorsComponent,
    canActivate: [AuthGuard],
  },
  { path: 'calendar', component: CalenderComponent, canActivate: [AuthGuard] },
  {
    path: 'inspection/edit/:id/:imageId',
    component: InspectionEditorComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'plan',
    component: PlanCaptureRoundComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'analytics',
    component: AnalyticsDashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'inspector-analytics/:id',
    component: InspectorAnalyticsComponent,
    canActivate: [AuthGuard],
  },
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
];
