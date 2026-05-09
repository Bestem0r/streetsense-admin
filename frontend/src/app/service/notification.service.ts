import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Notification } from '../interfaces/notification-interface';

import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private baseUrl = environment.apiUrl + '/notifications';
  private httpClient = inject(HttpClient);
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$: Observable<Notification[]> =
    this.notificationsSubject.asObservable();

  getNotifications(): Observable<Notification[]> {
    return this.httpClient.get<Notification[]>(this.baseUrl);
  }

  loadNotifications(notifications: Notification[]): void {
    this.notificationsSubject.next(notifications);
  }

  refresh(): void {
    this.getNotifications().subscribe((notifications) => {
      this.notificationsSubject.next(notifications);
    });
  }

  markAsRead(notificationId: string): void {
    this.httpClient
      .put(`${this.baseUrl}/${notificationId}/mark-as-read`, {})
      .subscribe(() => {
        const current = this.notificationsSubject.value;
        const updated = current.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n,
        );
        this.notificationsSubject.next(updated);
      });
  }

  clearNotification(notificationId: string): void {
    this.httpClient
      .delete(`${this.baseUrl}/${notificationId}`)
      .subscribe(() => {
        const current = this.notificationsSubject.value;
        const updated = current.filter((n) => n.id !== notificationId);
        this.notificationsSubject.next(updated);
      });
  }

  clearAllRead(): void {
    this.httpClient.post(`${this.baseUrl}/clear-read`, {}).subscribe(() => {
      const current = this.notificationsSubject.value;
      const updated = current.filter((n) => !n.read);
      this.notificationsSubject.next(updated);
    });
  }
}
