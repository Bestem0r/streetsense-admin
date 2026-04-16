package com.vegData.kafka_mongodb.controller;

import com.vegData.kafka_mongodb.collection.BatchNotification;
import com.vegData.kafka_mongodb.service.BatchNotificationService;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@Slf4j
@CrossOrigin(origins = "*")
public class BatchNotificationController {

  @Autowired private BatchNotificationService batchNotificationService;

  /**
   * Get all notifications
   */
  @GetMapping
  public ResponseEntity<List<BatchNotification>> getAllNotifications() {
    try {
      List<BatchNotification> notifications = batchNotificationService.getAllNotifications();
      return ResponseEntity.ok(notifications);
    } catch (Exception e) {
      log.error("Error fetching notifications", e);
      return ResponseEntity.status(500).build();
    }
  }

  /**
   * Get unread notifications count
   */
  @GetMapping("/unread-count")
  public ResponseEntity<Long> getUnreadCount() {
    try {
      long count = batchNotificationService.getUnreadCount();
      return ResponseEntity.ok(count);
    } catch (Exception e) {
      log.error("Error fetching unread count", e);
      return ResponseEntity.status(500).build();
    }
  }

  /**
   * Mark a notification as read
   */
  @PutMapping("/{id}/read")
  public ResponseEntity<Void> markAsRead(@PathVariable String id) {
    try {
      batchNotificationService.markAsRead(id);
      return ResponseEntity.ok().build();
    } catch (Exception e) {
      log.error("Error marking notification as read", e);
      return ResponseEntity.status(500).build();
    }
  }

  /**
   * Delete a notification
   */
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteNotification(@PathVariable String id) {
    try {
      batchNotificationService.deleteNotification(id);
      return ResponseEntity.ok().build();
    } catch (Exception e) {
      log.error("Error deleting notification", e);
      return ResponseEntity.status(500).build();
    }
  }
}
