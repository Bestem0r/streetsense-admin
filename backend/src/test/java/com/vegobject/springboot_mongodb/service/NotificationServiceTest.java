package com.vegobject.springboot_mongodb.service;

import com.vegobject.springboot_mongodb.collection.Notification;
import com.vegobject.springboot_mongodb.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @InjectMocks private NotificationService notificationService;

    private Notification makeNotification(String id, boolean read) {
        Notification n = new Notification();
        n.setId(id);
        n.setRead(read);
        return n;
    }

    @Test
    void getAllNotifications_delegatesRepository() {
        when(notificationRepository.findAll()).thenReturn(List.of(makeNotification("n1", false)));
        List<Notification> result = notificationService.getAllNotifications();
        assertEquals(1, result.size());
    }

    @Test
    void markAsRead_found_setsReadTrueAndSaves() {
        Notification n = makeNotification("n1", false);
        when(notificationRepository.findById("n1")).thenReturn(Optional.of(n));

        notificationService.markAsRead("n1");

        assertTrue(n.isRead());
        verify(notificationRepository).save(n);
    }

    @Test
    void markAsRead_notFound_noSave() {
        when(notificationRepository.findById("n99")).thenReturn(Optional.empty());
        notificationService.markAsRead("n99");
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void markAllAsRead_setsAllReadAndSavesAll() {
        Notification a = makeNotification("a", false);
        Notification b = makeNotification("b", false);
        when(notificationRepository.findAll()).thenReturn(List.of(a, b));

        notificationService.markAllAsRead();

        assertTrue(a.isRead());
        assertTrue(b.isRead());
        verify(notificationRepository).saveAll(List.of(a, b));
    }

    @Test
    void clearNotification_delegatesDeleteById() {
        notificationService.clearNotification("n1");
        verify(notificationRepository).deleteById("n1");
    }

    @Test
    void clearAllReadNotifications_onlyDeletesReadOnes() {
        Notification read = makeNotification("r1", true);
        Notification unread = makeNotification("u1", false);
        when(notificationRepository.findAll()).thenReturn(List.of(read, unread));

        notificationService.clearAllReadNotifications();

        verify(notificationRepository).deleteById("r1");
        verify(notificationRepository, never()).deleteById("u1");
    }

    @Test
    void clearAllReadNotifications_noReadNotifications_noDeletion() {
        Notification unread = makeNotification("u1", false);
        when(notificationRepository.findAll()).thenReturn(List.of(unread));

        notificationService.clearAllReadNotifications();

        verify(notificationRepository, never()).deleteById(any());
    }

    @Test
    void deleteByType_delegatesRepository() {
        notificationService.deleteByType("planned-capture");
        verify(notificationRepository).deleteByType("planned-capture");
    }

    @Test
    void createNotification_savesWithCorrectFields() {
        notificationService.createNotification("overdue", "warning", List.of("p1", "p2"));

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();

        assertEquals("overdue", saved.getType());
        assertEquals("warning", saved.getSeverity());
        assertEquals(2, saved.getPolesCount());
        assertFalse(saved.isRead());
        assertNotNull(saved.getCreatedDate());
    }

    @Test
    void createNotification_poleIdsStoredInArray() {
        notificationService.createNotification("overdue", "warning", List.of("p1", "p2", "p3"));

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertEquals(3, captor.getValue().getPoleIds().length);
    }

    @Test
    void createCaptureNotification_savesWithCaptureId() {
        notificationService.createCaptureNotification("cap1", "planned-capture", "info", 5);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();

        assertEquals("cap1", saved.getCaptureId());
        assertEquals("planned-capture", saved.getType());
        assertEquals("info", saved.getSeverity());
        assertEquals(5, saved.getPolesCount());
        assertFalse(saved.isRead());
        assertNotNull(saved.getCreatedDate());
    }
}
