package com.vegobject.springboot_mongodb.service;

import com.vegobject.springboot_mongodb.collection.Capture;
import com.vegobject.springboot_mongodb.collection.ImageInfo;
import com.vegobject.springboot_mongodb.collection.Pole;
import com.vegobject.springboot_mongodb.repository.CaptureRepository;
import com.vegobject.springboot_mongodb.repository.PolesRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class ScheduledNotificationService {

  private static final long DAY_MS = 86_400_000L;
  private static final long WARNING_DAYS = 14;
  private static final long CRITICAL_DAYS = 30;
  private static final long CAPTURE_DUE_WARNING_DAYS = 3;

  @Autowired private PolesRepository polesRepository;
  @Autowired private CaptureRepository captureRepository;
  @Autowired private NotificationService notificationService;

  @Scheduled(cron = "0 0 6 * * *")
  public void checkOverduePoles() {
    long now = System.currentTimeMillis();

    notificationService.deleteByType("overdue-inspection");

    List<Pole> poles = polesRepository.findAll();

    List<String> warningPoles = poles.stream()
        .filter(this::hasUninspectedImages)
        .filter(p -> p.getCapturedDate() != null)
        .filter(p -> {
          long days = (now - p.getCapturedDate()) / DAY_MS;
          return days >= WARNING_DAYS && days < CRITICAL_DAYS;
        })
        .map(Pole::getId)
        .toList();

    List<String> criticalPoles = poles.stream()
        .filter(this::hasUninspectedImages)
        .filter(p -> p.getCapturedDate() != null)
        .filter(p -> (now - p.getCapturedDate()) / DAY_MS >= CRITICAL_DAYS)
        .map(Pole::getId)
        .toList();

    if (!warningPoles.isEmpty()) {
      notificationService.createNotification("overdue-inspection", "warning", warningPoles);
    }
    if (!criticalPoles.isEmpty()) {
      notificationService.createNotification("overdue-inspection", "error", criticalPoles);
    }
  }

  @Scheduled(cron = "0 0 6 * * *")
  public void checkUpcomingCaptures() {
    long now = System.currentTimeMillis();
    long warningWindowEnd = now + CAPTURE_DUE_WARNING_DAYS * DAY_MS;

    notificationService.deleteByType("capture-due");

    List<Capture> captures = captureRepository.findAll();
    captures.stream()
        .filter(c -> c.getEndDate() != null)
        .filter(c -> c.getEndDate() >= now && c.getEndDate() <= warningWindowEnd)
        .forEach(c -> {
          String cid = c.getId();
          if (cid != null) {
            notificationService.createCaptureNotification(cid, "capture-due", "warning", 0);
          }
        });
  }

  private boolean hasUninspectedImages(Pole pole) {
    List<ImageInfo> images = pole.getImages();
    if (images == null || images.isEmpty()) return false;
    return images.stream().anyMatch(img -> !"inspected".equals(img.getInspectionStatus()));
  }
}
