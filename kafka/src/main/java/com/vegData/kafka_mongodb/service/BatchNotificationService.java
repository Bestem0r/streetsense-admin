package com.vegData.kafka_mongodb.service;

import com.vegData.kafka_mongodb.collection.BatchNotification;
import com.vegData.kafka_mongodb.collection.Pole;
import java.util.List;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

/**
 * Service to create and manage batch notifications from Kafka data
 */
@Service
@Slf4j
public class BatchNotificationService {

  @Autowired private MongoTemplate mongoTemplate;

  @Autowired private BatchNotificationCollector batchCollector;

  public BatchNotificationService() {}

  /**
   * Create a batch capture notification for multiple poles
   */
  public BatchNotification createBatchCaptureNotification(List<Pole> poles) {
    if (poles == null || poles.isEmpty()) {
      return null;
    }

    String[] poleIds = poles.stream().map(Pole::getId).toArray(String[]::new);

    BatchNotification notification =
        new BatchNotification();
    notification.setId(UUID.randomUUID().toString());
    notification.setType("capture");
    notification.setSeverity("info");
    notification.setPolesCount(poles.size());
    notification.setCreatedDate(System.currentTimeMillis());
    notification.setRead(false);
    notification.setPoleIds(poleIds);

    mongoTemplate.save(notification, "notifications");
    log.info("Created batch capture notification for {} poles", poles.size());

    return notification;
  }

  /**
   * Create a batch overdue notification for multiple poles
   */
  /* public BatchNotification createBatchOverdueNotification(List<Pole> poles) {
    if (poles == null || poles.isEmpty()) {
      return null;
    }

    String[] poleIds = poles.stream().map(Pole::getId).toArray(String[]::new);

    BatchNotification notification =
        new BatchNotification();
    notification.setId(UUID.randomUUID().toString());
    notification.setType("batch-overdue");
    notification.setTitle(poles.size() + " Poles Have Overdue Inspections");
    notification.setMessage(
        poles.size()
            + " poles have images that are overdue for inspection. ");
    notification.setSeverity("error");
    notification.setPolesCount(poles.size());
    notification.setCreatedDate(System.currentTimeMillis());
    notification.setRead(false);
    notification.setPoleIds(poleIds);

    mongoTemplate.save(notification, "notifications");
    log.info("Created batch overdue notification for {} poles", poles.size());

    return notification;
  } */

  /**
   * Create a batch action-needed notification
   */
  /* public BatchNotification createBatchActionNeededNotification(List<Pole> poles) {
    if (poles == null || poles.isEmpty()) {
      return null;
    }

    String[] poleIds = poles.stream().map(Pole::getId).toArray(String[]::new);

    BatchNotification notification =
        new BatchNotification();
    notification.setId(UUID.randomUUID().toString());
    notification.setType("batch-action");
    notification.setTitle(poles.size() + " Poles Require Action");
    notification.setMessage(
        poles.size()
            + " poles require action (Need New Poles or Need Replacement). ");
    notification.setSeverity("warning");
    notification.setPolesCount(poles.size());
    notification.setCreatedDate(System.currentTimeMillis());
    notification.setRead(false);
    notification.setPoleIds(poleIds);

    mongoTemplate.save(notification, "notifications");
    log.info("Created batch action notification for {} poles", poles.size());

    return notification;
  } */

  /**
   * Get all notifications (for frontend display)
   */
  public List<BatchNotification> getAllNotifications() {
    return mongoTemplate.findAll(BatchNotification.class, "notifications");
  }

  /**
   * Get unread notifications count
   */
  public long getUnreadCount() {
    return mongoTemplate.findAll(BatchNotification.class, "notifications").stream()
        .filter(n -> !n.isRead())
        .count();
  }

  /**
   * Mark notification as read
   */
  public void markAsRead(String notificationId) {
    BatchNotification notification = mongoTemplate.findById(notificationId, BatchNotification.class, "notifications");
    if (notification != null) {
      notification.setRead(true);
      mongoTemplate.save(notification, "notifications");
      log.info("Marked notification {} as read", notificationId);
    }
  }

  /**
   * Delete notification
   */
  public void deleteNotification(String notificationId) {
    mongoTemplate.remove(new org.springframework.data.mongodb.core.query.Query(
            org.springframework.data.mongodb.core.query.Criteria.where("_id").is(notificationId)),
        "notifications");
    log.info("Deleted notification {}", notificationId);
  }
}
