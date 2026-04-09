import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
  imports: [MatIconModule, CommonModule],
})
export class NavComponent {
  isNotificationsOpen = false;
  isAvatarMenuOpen = false;
  private router = inject(Router);

  navigateTo(link: string) {
    this.router.navigate([link]);
  }

  setNotificationsOpen(value: boolean) {
    this.isAvatarMenuOpen = false;
    this.isNotificationsOpen = value;
  }

  setAvatarMenuOpen(value: boolean) {
    this.isNotificationsOpen = false;
    this.isAvatarMenuOpen = value;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!target.closest('#userDropdown') && !target.closest('#avatarButton')) {
      this.isAvatarMenuOpen = false;
    }
    if (
      !target.closest('#notificationDropdown') &&
      !target.closest('#notificationButton')
    ) {
      this.isNotificationsOpen = false;
    }
  }
}
