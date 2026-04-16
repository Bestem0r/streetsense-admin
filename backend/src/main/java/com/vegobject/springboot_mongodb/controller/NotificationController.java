package com.vegobject.springboot_mongodb.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vegobject.springboot_mongodb.collection.Notification;
import com.vegobject.springboot_mongodb.service.NotificationService;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

  @Autowired
  private NotificationService notificationService;

  /**
   * Get all notifications
    * @return list of notifications
   */
  @GetMapping
  public ResponseEntity<List<Notification>> getAllNotifications() {
    return ResponseEntity.ok(notificationService.getAllNotifications());
  }

  

  /**
   * Mark a notification as read
   *
   * @param id the ID of the notification to mark as read
   * @return 200 OK if successful, 404 Not Found if notification does not exist
   */
  @PutMapping("/{id}/mark-as-read")
  public ResponseEntity<Void> markAsRead(@NonNull @PathVariable String id) {
    try {
      notificationService.markAsRead(id);
      return ResponseEntity.ok().build();
    } catch (Exception e) {
      return ResponseEntity.notFound().build();
    }
  }

  /**
   * Mark all notifications as read
   *
   * @return 200 OK if successful
   */
  @PostMapping("/mark-all-as-read")
  public ResponseEntity<Void> markAllAsRead() {
    notificationService.markAllAsRead();
    return ResponseEntity.ok().build();
  }

  /**
   * Clear a notification by ID
   *
   * @param id the ID of the notification to clear
   * @return 200 OK if successful, 404 Not Found if notification does not exist
   */
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteNotification(@NonNull @PathVariable String id) {
    try {
      notificationService.clearNotification(id);
      return ResponseEntity.ok().build();
    } catch (Exception e) {
      return ResponseEntity.notFound().build();
    }
  }

  /**
   * Clear all read notifications
   *
   * @return 200 OK if successful
   */
  @DeleteMapping("/clear-read")
  public ResponseEntity<Void> clearReadNotifications() {
    notificationService.clearAllReadNotifications();
    return ResponseEntity.ok().build();
  }

}
