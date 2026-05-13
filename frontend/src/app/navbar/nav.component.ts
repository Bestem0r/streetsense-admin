import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { Notification } from '../interfaces/notification-interface';
import { NotificationService } from '../service/notification.service';
import { AuthService, UserData } from '../service/auth.service';
import { getAvatarColor } from '../utils/avatar.utils';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
  imports: [MatIconModule, CommonModule, RouterModule],
})
export class NavComponent implements OnInit {
  isNotificationsOpen = false;
  isAvatarMenuOpen = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  readCount = 0;
  tab = 0;
  currentUser: UserData | null = null;

  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.notificationService.notifications$.subscribe((notifications) => {
      this.notifications = notifications;
      this.unreadCount = notifications.filter((n) => !n.read).length;
      this.readCount = notifications.filter((n) => n.read).length;
    });

    this.notificationService.getNotifications().subscribe((notifications) => {
      this.notificationService.loadNotifications(notifications);
    });

    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  setNotificationsOpen(value: boolean) {
    this.isAvatarMenuOpen = false;
    this.isNotificationsOpen = value;
  }

  setAvatarMenuOpen(value: boolean) {
    this.isNotificationsOpen = false;
    this.isAvatarMenuOpen = value;
  }

  markAsRead(Id: string): void {
    this.notificationService.markAsRead(Id);
  }

  clearNotification(Id: string): void {
    this.notificationService.clearNotification(Id);
  }

  clearAllRead(): void {
    let notificationsToClear: Notification[] = [];

    switch (this.tab) {
      case 0:
        notificationsToClear = this.notifications.filter((n) => n.read);
        break;
      case 1:
        notificationsToClear = [];
        break;
      case 2:
        notificationsToClear = this.criticalNotifications.filter((n) => n.read);
        break;
      case 3:
        notificationsToClear = this.warningNotifications.filter((n) => n.read);
        break;
      case 4:
        notificationsToClear = this.infoNotifications.filter((n) => n.read);
        break;
    }

    notificationsToClear.forEach((n) =>
      this.notificationService.clearNotification(n.id),
    );
  }

  markAllAsRead(): void {
    let notificationsToMark: Notification[] = [];

    switch (this.tab) {
      case 0:
        notificationsToMark = this.unreadNotifications;
        break;
      case 1:
        notificationsToMark = this.unreadNotifications;
        break;
      case 2:
        notificationsToMark = this.criticalNotifications.filter((n) => !n.read);
        break;
      case 3:
        notificationsToMark = this.warningNotifications.filter((n) => !n.read);
        break;
      case 4:
        notificationsToMark = this.infoNotifications.filter((n) => !n.read);
        break;
    }

    notificationsToMark.forEach((n) =>
      this.notificationService.markAsRead(n.id),
    );
  }

  get unreadNotifications(): Notification[] {
    return this.notifications.filter((n) => !n.read);
  }

  get criticalNotifications(): Notification[] {
    return this.notifications.filter((n) => n.severity === 'error');
  }

  get warningNotifications(): Notification[] {
    return this.notifications.filter((n) => n.severity === 'warning');
  }

  get infoNotifications(): Notification[] {
    return this.notifications.filter((n) => n.severity === 'info');
  }

  get currentTabNotifications(): Notification[] {
    switch (this.tab) {
      case 0:
        return this.notifications;
      case 1:
        return this.unreadNotifications;
      case 2:
        return this.criticalNotifications;
      case 3:
        return this.warningNotifications;
      case 4:
        return this.infoNotifications;
      default:
        return this.notifications;
    }
  }

  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'error':
        return 'border-l-red-500 bg-red-900/20 ';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-900/20';
      case 'info':
      default:
        return 'border-l-blue-500 bg-blue-900/20';
    }
  }

  getSeverityRingClass(severity: string): string {
    switch (severity) {
      case 'error':
        return 'ring-1 ring-red-500';
      case 'warning':
        return 'ring-yellow-500';
      case 'info':
      default:
        return 'ring-blue-500';
    }
  }

  getAvatarColor(id: string): string { return getAvatarColor(id); }

  signOut(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
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
