import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { NavComponent } from '../navbar/nav.component';
import { AuthService } from '../service/auth.service';

type SettingsTab = 'profile' | 'notifications' | 'team' | 'system';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, NavComponent],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);

  activeTab: SettingsTab = 'profile';

  // Profile
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  role = '';
  defaultCounty = '';

  profileSaving = false;
  profileSaved = false;
  profileError = '';

  // Password
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  passwordSaving = false;
  passwordSaved = false;
  passwordError = '';

  counties = ['Oslo', 'Viken', 'Innlandet', 'Vestfold', 'Troms', 'Nordland'];

  // Notifications (static)
  notifNewCapture = true;
  notifNewCaptureThreshold = 10;
  notifOverdue = true;
  notifOverdueDays = 3;
  notifAssignment = false;
  notifWeeklyEmail = true;

  // Team (static)
  inviteEmail = '';
  inviteRole = 'Inspector';
  roles = ['Inspector', 'Admin', 'Viewer'];

  teamMembers = [
    { name: 'Lars Hansen',    email: 'lars.hansen@vegobject.no',   role: 'Admin',     county: 'Oslo',      active: true  },
    { name: 'Maja Andersen',  email: 'maja.andersen@vegobject.no', role: 'Inspector', county: 'Viken',     active: true  },
    { name: 'Bjørn Olsen',    email: 'bjorn.olsen@vegobject.no',   role: 'Inspector', county: 'Innlandet', active: false },
    { name: 'Ingrid Nygaard', email: 'ingrid.ny@vegobject.no',     role: 'Viewer',    county: 'Vestfold',  active: true  },
  ];

  // System (static)
  defaultMapLayer = 'Kartverket';
  mapLayers = ['Kartverket', 'OpenStreetMap', 'Satellite'];
  defaultCountyFilter = 'All Counties';
  captureFrequency = 90;
  overdueThreshold = 14;
  minPhotosPerPole = 3;
  flagEscalationDays = 30;

  readonly tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'profile',       label: 'My Profile',      icon: 'person'        },
    { id: 'notifications', label: 'Notifications',   icon: 'notifications' },
    { id: 'team',          label: 'Team Management', icon: 'group'         },
    { id: 'system',        label: 'System Config',   icon: 'settings'      },
  ];

  get initials(): string {
    return ((this.firstName[0] ?? '') + (this.lastName[0] ?? '')).toUpperCase() || '?';
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.firstName = user.firstName ?? '';
        this.lastName  = user.lastName  ?? '';
        this.email     = user.email     ?? '';
        this.phone     = user.phoneNumber ?? (user as any).phone ?? '';
        this.role      = user.role      ?? '';
        this.defaultCounty = user.county ?? '';
      }
    });
  }

  saveProfile(): void {
    this.profileSaving = true;
    this.profileSaved  = false;
    this.profileError  = '';

    this.authService.updateProfile({
      firstName: this.firstName,
      lastName:  this.lastName,
      phone:     this.phone,
      county:    this.defaultCounty,
    }).subscribe({
      next: () => {
        this.profileSaving = false;
        this.profileSaved  = true;
        this.authService.refreshCurrentUser();
        setTimeout(() => (this.profileSaved = false), 3000);
      },
      error: (err: any) => {
        this.profileSaving = false;
        this.profileError  = err?.error?.message ?? 'Failed to save profile.';
      },
    });
  }

  savePassword(): void {
    this.passwordError = '';
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordError = 'All password fields are required.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'New passwords do not match.';
      return;
    }
    this.passwordSaving = true;
    this.passwordSaved  = false;

    this.authService.changePassword(this.currentPassword, this.newPassword, this.confirmPassword).subscribe({
      next: () => {
        this.passwordSaving = false;
        this.passwordSaved  = true;
        this.currentPassword = '';
        this.newPassword     = '';
        this.confirmPassword = '';
        setTimeout(() => (this.passwordSaved = false), 3000);
      },
      error: (err: any) => {
        this.passwordSaving = false;
        this.passwordError  = err?.error?.message ?? 'Incorrect current password.';
      },
    });
  }
}
