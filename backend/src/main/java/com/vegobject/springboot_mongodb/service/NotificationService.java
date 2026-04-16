package com.vegobject.springboot_mongodb.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.vegobject.springboot_mongodb.collection.Notification;
import com.vegobject.springboot_mongodb.repository.NotificationRepository;

@Service
public class NotificationService {

  @Autowired  private NotificationRepository notificationRepository;

  public List<Notification> getAllNotifications() {
    return notificationRepository.findAll();
  }


  public void markAsRead(@NonNull String id) {
    Notification notification = notificationRepository.findById(id).orElse(null);
    if (notification != null) {
      notification.setRead(true);
      notificationRepository.save(notification);
    }
  }
  public void markAllAsRead() {
    List<Notification> notifications = notificationRepository.findAll();
    notifications.forEach(n -> n.setRead(true));
    notificationRepository.saveAll(notifications);
  }

  public void clearNotification(@NonNull String id) {
  notificationRepository.deleteById(id);
}
  @SuppressWarnings("null")
  public void clearAllReadNotifications() {
    List<Notification> notifications = notificationRepository.findAll();
    notifications.stream().filter(Notification::isRead).forEach(n -> notificationRepository.deleteById(n.getId()));
  }

  
}
