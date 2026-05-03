import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { BehaviorSubject, of } from 'rxjs';
import { NavComponent } from './nav.component';
import { NotificationService } from '../service/notification.service';
import { AuthService, UserData } from '../service/auth.service';
import { Notification } from '../interfaces/notification-interface';

vi.mock('leaflet', () => {
  const stub = () => {
    const self: any = {
      addTo: vi.fn(() => self),
      setPosition: vi.fn(() => self),
      addLayer: vi.fn(() => self),
      removeLayer: vi.fn(() => self),
      clearLayers: vi.fn(() => self),
      on: vi.fn(() => self),
      off: vi.fn(() => self),
      addControl: vi.fn(() => self),
      remove: vi.fn(() => self),
      fitBounds: vi.fn(() => self),
      setView: vi.fn(() => self),
      getLatLng: vi.fn(() => ({ lat: 0, lng: 0 })),
      bindPopup: vi.fn(() => self),
      openPopup: vi.fn(() => self),
      setIcon: vi.fn(() => self),
      getBounds: vi.fn(() => ({ toBBoxString: () => '' })),
    };
    return self;
  };
  function FeatureGroup() {
    return stub();
  }
  function DrawControl() {
    return stub();
  }
  const L = {
    map: vi.fn(stub),
    layerGroup: vi.fn(stub),
    featureGroup: vi.fn(stub),
    FeatureGroup,
    icon: vi.fn(() => ({})),
    tileLayer: vi.fn(stub),
    marker: vi.fn(stub),
    control: { layers: vi.fn(stub), scale: vi.fn(stub) },
    Control: { extend: vi.fn(), Draw: DrawControl },
    Draw: {
      Event: {
        CREATED: 'draw:created',
        DELETED: 'draw:deleted',
        EDITED: 'draw:edited',
      },
    },
  };
  return { ...L, default: L };
});
vi.mock('leaflet-draw', () => ({ default: {} }));

const makeNotif = (overrides: Partial<Notification> = {}): Notification => ({
  id: '1',
  type: 'capture',
  poleIds: [],
  severity: 'info',
  createdDate: 1700000000,
  polesCount: 1,
  read: false,
  ...overrides,
});

const makeUser = (overrides: Partial<UserData> = {}): UserData => ({
  id: 'u1',
  userName: 'jdoe',
  email: 'jdoe@test.com',
  firstName: 'John',
  lastName: 'Doe',
  phoneNumber: '123456789',
  role: 'admin',
  profileImage: '',
  createdAt: '2024-01-01',
  ...overrides,
});

describe('NavComponent', () => {
  let component: NavComponent;
  let fixture: ComponentFixture<NavComponent>;
  let router: Router;
  let notificationsSubject: BehaviorSubject<Notification[]>;
  let currentUserSubject: BehaviorSubject<UserData | null>;
  let mockNotificationService: any;
  let mockAuthService: any;

  beforeEach(async () => {
    notificationsSubject = new BehaviorSubject<Notification[]>([]);
    currentUserSubject = new BehaviorSubject<UserData | null>(null);

    mockNotificationService = {
      notifications$: notificationsSubject.asObservable(),
      getNotifications: vi.fn(() => of([])),
      loadNotifications: vi.fn(),
      markAsRead: vi.fn(),
      clearNotification: vi.fn(),
    };

    mockAuthService = {
      currentUser$: currentUserSubject.asObservable(),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [NavComponent],
      providers: [
        provideRouter([]),
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should fetch and load notifications', () => {
      expect(mockNotificationService.getNotifications).toHaveBeenCalled();
      expect(mockNotificationService.loadNotifications).toHaveBeenCalledWith(
        [],
      );
    });

    it('should update notifications, unreadCount, and readCount from notifications$', () => {
      const notifs = [
        makeNotif({ id: '1', read: false }),
        makeNotif({ id: '2', read: true }),
        makeNotif({ id: '3', read: false }),
      ];
      notificationsSubject.next(notifs);

      expect(component.notifications).toEqual(notifs);
      expect(component.unreadCount).toBe(2);
      expect(component.readCount).toBe(1);
    });

    it('should track currentUser from authService', () => {
      const user = makeUser();
      currentUserSubject.next(user);
      expect(component.currentUser).toEqual(user);
    });

    it('should set currentUser to null when logged out', () => {
      currentUserSubject.next(makeUser());
      currentUserSubject.next(null);
      expect(component.currentUser).toBeNull();
    });
  });

  describe('setNotificationsOpen', () => {
    it('should open the notifications panel and close avatar menu', () => {
      component.isAvatarMenuOpen = true;
      component.setNotificationsOpen(true);
      expect(component.isNotificationsOpen).toBe(true);
      expect(component.isAvatarMenuOpen).toBe(false);
    });

    it('should close the notifications panel', () => {
      component.isNotificationsOpen = true;
      component.setNotificationsOpen(false);
      expect(component.isNotificationsOpen).toBe(false);
    });
  });

  describe('setAvatarMenuOpen', () => {
    it('should open the avatar menu and close notifications', () => {
      component.isNotificationsOpen = true;
      component.setAvatarMenuOpen(true);
      expect(component.isAvatarMenuOpen).toBe(true);
      expect(component.isNotificationsOpen).toBe(false);
    });

    it('should close the avatar menu', () => {
      component.isAvatarMenuOpen = true;
      component.setAvatarMenuOpen(false);
      expect(component.isAvatarMenuOpen).toBe(false);
    });
  });

  describe('markAsRead', () => {
    it('should delegate to notification service with the given id', () => {
      component.markAsRead('notif-abc');
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(
        'notif-abc',
      );
    });
  });

  describe('clearNotification', () => {
    it('should delegate to notification service with the given id', () => {
      component.clearNotification('notif-xyz');
      expect(mockNotificationService.clearNotification).toHaveBeenCalledWith(
        'notif-xyz',
      );
    });
  });

  describe('signOut', () => {
    it('should call authService logout and navigate to /login', () => {
      const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component.signOut();
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(navSpy).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('currentTabNotifications', () => {
    beforeEach(() => {
      component.notifications = [
        makeNotif({ id: '1', severity: 'error', read: false }),
        makeNotif({ id: '2', severity: 'warning', read: true }),
        makeNotif({ id: '3', severity: 'info', read: false }),
      ];
    });

    it('tab 0 returns all notifications', () => {
      component.tab = 0;
      expect(component.currentTabNotifications).toEqual(
        component.notifications,
      );
    });

    it('tab 1 returns only unread notifications', () => {
      component.tab = 1;
      expect(component.currentTabNotifications.map((n) => n.id)).toEqual([
        '1',
        '3',
      ]);
    });

    it('tab 2 returns only critical (error) notifications', () => {
      component.tab = 2;
      expect(component.currentTabNotifications.map((n) => n.id)).toEqual(['1']);
    });

    it('tab 3 returns only warning notifications', () => {
      component.tab = 3;
      expect(component.currentTabNotifications.map((n) => n.id)).toEqual(['2']);
    });

    it('tab 4 returns only info notifications', () => {
      component.tab = 4;
      expect(component.currentTabNotifications.map((n) => n.id)).toEqual(['3']);
    });

    it('unknown tab falls back to all notifications', () => {
      component.tab = 99;
      expect(component.currentTabNotifications).toEqual(
        component.notifications,
      );
    });
  });

  describe('clearAllRead', () => {
    beforeEach(() => {
      component.notifications = [
        makeNotif({ id: '1', severity: 'error', read: true }),
        makeNotif({ id: '2', severity: 'error', read: false }),
        makeNotif({ id: '3', severity: 'warning', read: true }),
        makeNotif({ id: '4', severity: 'info', read: true }),
        makeNotif({ id: '5', severity: 'info', read: false }),
      ];
      vi.clearAllMocks();
    });

    it('tab 0: clears all read notifications across all severities', () => {
      component.tab = 0;
      component.clearAllRead();
      expect(mockNotificationService.clearNotification).toHaveBeenCalledTimes(
        3,
      );
      expect(mockNotificationService.clearNotification).toHaveBeenCalledWith(
        '1',
      );
      expect(mockNotificationService.clearNotification).toHaveBeenCalledWith(
        '3',
      );
      expect(mockNotificationService.clearNotification).toHaveBeenCalledWith(
        '4',
      );
    });

    it('tab 1: clears nothing', () => {
      component.tab = 1;
      component.clearAllRead();
      expect(mockNotificationService.clearNotification).not.toHaveBeenCalled();
    });

    it('tab 2: clears only read critical notifications', () => {
      component.tab = 2;
      component.clearAllRead();
      expect(mockNotificationService.clearNotification).toHaveBeenCalledTimes(
        1,
      );
      expect(mockNotificationService.clearNotification).toHaveBeenCalledWith(
        '1',
      );
    });

    it('tab 3: clears only read warning notifications', () => {
      component.tab = 3;
      component.clearAllRead();
      expect(mockNotificationService.clearNotification).toHaveBeenCalledTimes(
        1,
      );
      expect(mockNotificationService.clearNotification).toHaveBeenCalledWith(
        '3',
      );
    });

    it('tab 4: clears only read info notifications', () => {
      component.tab = 4;
      component.clearAllRead();
      expect(mockNotificationService.clearNotification).toHaveBeenCalledTimes(
        1,
      );
      expect(mockNotificationService.clearNotification).toHaveBeenCalledWith(
        '4',
      );
    });
  });

  describe('markAllAsRead', () => {
    beforeEach(() => {
      component.notifications = [
        makeNotif({ id: '1', severity: 'error', read: false }),
        makeNotif({ id: '2', severity: 'error', read: true }),
        makeNotif({ id: '3', severity: 'warning', read: false }),
        makeNotif({ id: '4', severity: 'info', read: false }),
        makeNotif({ id: '5', severity: 'info', read: true }),
      ];
      vi.clearAllMocks();
    });

    it('tab 0: marks all unread notifications as read', () => {
      component.tab = 0;
      component.markAllAsRead();
      expect(mockNotificationService.markAsRead).toHaveBeenCalledTimes(3);
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('1');
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('3');
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('4');
    });

    it('tab 1: marks all unread notifications as read', () => {
      component.tab = 1;
      component.markAllAsRead();
      expect(mockNotificationService.markAsRead).toHaveBeenCalledTimes(3);
    });

    it('tab 2: marks unread critical notifications as read', () => {
      component.tab = 2;
      component.markAllAsRead();
      expect(mockNotificationService.markAsRead).toHaveBeenCalledTimes(1);
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('1');
    });

    it('tab 3: marks unread warning notifications as read', () => {
      component.tab = 3;
      component.markAllAsRead();
      expect(mockNotificationService.markAsRead).toHaveBeenCalledTimes(1);
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('3');
    });

    it('tab 4: marks unread info notifications as read', () => {
      component.tab = 4;
      component.markAllAsRead();
      expect(mockNotificationService.markAsRead).toHaveBeenCalledTimes(1);
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('4');
    });
  });

  describe('getSeverityClass', () => {
    it('returns red styling for error', () => {
      expect(component.getSeverityClass('error')).toContain('red');
    });

    it('returns yellow styling for warning', () => {
      expect(component.getSeverityClass('warning')).toContain('yellow');
    });

    it('returns blue styling for info', () => {
      expect(component.getSeverityClass('info')).toContain('blue');
    });

    it('defaults to blue styling for unknown severity', () => {
      expect(component.getSeverityClass('unknown')).toContain('blue');
    });
  });

  describe('getSeverityRingClass', () => {
    it('returns red ring with ring-1 for error', () => {
      const cls = component.getSeverityRingClass('error');
      expect(cls).toContain('red');
      expect(cls).toContain('ring-1');
    });

    it('returns yellow ring for warning', () => {
      expect(component.getSeverityRingClass('warning')).toContain('yellow');
    });

    it('returns blue ring for info', () => {
      expect(component.getSeverityRingClass('info')).toContain('blue');
    });

    it('defaults to blue ring for unknown severity', () => {
      expect(component.getSeverityRingClass('unknown')).toContain('blue');
    });
  });

  describe('onDocumentClick', () => {
    const outsideClick = () =>
      ({ target: document.createElement('div') }) as unknown as MouseEvent;

    it('closes avatar menu when clicking outside userDropdown and avatarButton', () => {
      component.isAvatarMenuOpen = true;
      component.onDocumentClick(outsideClick());
      expect(component.isAvatarMenuOpen).toBe(false);
    });

    it('closes notifications when clicking outside notificationDropdown and notificationButton', () => {
      component.isNotificationsOpen = true;
      component.onDocumentClick(outsideClick());
      expect(component.isNotificationsOpen).toBe(false);
    });
  });
});
