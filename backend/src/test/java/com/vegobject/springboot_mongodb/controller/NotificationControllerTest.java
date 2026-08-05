package com.vegobject.springboot_mongodb.controller;

import com.vegobject.springboot_mongodb.collection.Notification;
import com.vegobject.springboot_mongodb.config.SecurityConfig;
import com.vegobject.springboot_mongodb.security.CustomUserDetailsService;
import com.vegobject.springboot_mongodb.security.JwtTokenProvider;
import com.vegobject.springboot_mongodb.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(NotificationController.class)
@Import(SecurityConfig.class)
class NotificationControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private NotificationService notificationService;
    @MockitoBean private JwtTokenProvider jwtTokenProvider;
    @MockitoBean private CustomUserDetailsService customUserDetailsService;

    private Notification notification(String id, boolean read) {
        Notification n = new Notification();
        n.setId(id);
        n.setType("overdue");
        n.setSeverity("warning");
        n.setRead(read);
        return n;
    }

    // ── GET /notifications ────────────────────────────────────────────────────

    @Test
    void getAllNotifications_returns200WithList() throws Exception {
        when(notificationService.getAllNotifications())
                .thenReturn(List.of(notification("n1", false), notification("n2", true)));

        mockMvc.perform(get("/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value("n1"));
    }

    @Test
    void getAllNotifications_empty_returns200() throws Exception {
        when(notificationService.getAllNotifications()).thenReturn(List.of());

        mockMvc.perform(get("/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ── PUT /notifications/{id}/mark-as-read ──────────────────────────────────

    @Test
    void markAsRead_success_returns200() throws Exception {
        doNothing().when(notificationService).markAsRead("n1");

        mockMvc.perform(put("/notifications/n1/mark-as-read"))
                .andExpect(status().isOk());

        verify(notificationService).markAsRead("n1");
    }

    @Test
    void markAsRead_serviceThrows_returns404() throws Exception {
        doThrow(new RuntimeException("not found")).when(notificationService).markAsRead("n99");

        mockMvc.perform(put("/notifications/n99/mark-as-read"))
                .andExpect(status().isNotFound());
    }

    // ── POST /notifications/mark-all-as-read ─────────────────────────────────

    @Test
    void markAllAsRead_returns200() throws Exception {
        doNothing().when(notificationService).markAllAsRead();

        mockMvc.perform(post("/notifications/mark-all-as-read"))
                .andExpect(status().isOk());

        verify(notificationService).markAllAsRead();
    }

    // ── DELETE /notifications/{id} ────────────────────────────────────────────

    @Test
    void deleteNotification_success_returns200() throws Exception {
        doNothing().when(notificationService).clearNotification("n1");

        mockMvc.perform(delete("/notifications/n1"))
                .andExpect(status().isOk());

        verify(notificationService).clearNotification("n1");
    }

    @Test
    void deleteNotification_serviceThrows_returns404() throws Exception {
        doThrow(new RuntimeException("not found")).when(notificationService).clearNotification("n99");

        mockMvc.perform(delete("/notifications/n99"))
                .andExpect(status().isNotFound());
    }

    // ── DELETE /notifications/clear-read ─────────────────────────────────────

    @Test
    void clearReadNotifications_returns200() throws Exception {
        doNothing().when(notificationService).clearAllReadNotifications();

        mockMvc.perform(delete("/notifications/clear-read"))
                .andExpect(status().isOk());

        verify(notificationService).clearAllReadNotifications();
    }
}
