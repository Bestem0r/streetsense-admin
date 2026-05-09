package com.vegobject.springboot_mongodb.service;

import com.vegobject.springboot_mongodb.collection.Capture;
import com.vegobject.springboot_mongodb.repository.CaptureRepository;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

@Service
public class PlanCaptureService {

  private static final Logger log = LoggerFactory.getLogger(PlanCaptureService.class);

  @Autowired private CaptureRepository captureRepository;
  @Autowired private NotificationService notificationService;

  public @NonNull Capture addCaptureRound(@NonNull Capture capture) {
    Capture saved = captureRepository.save(capture);
    String savedId = saved.getId();
    log.info("Capture saved id={}", savedId);
    if (savedId != null) {
      try {
        int poleCount = saved.getPoles() != null ? saved.getPoles().size() : 0;
        notificationService.createCaptureNotification(savedId, "planned-capture", "info", poleCount);
        log.info("Notification created for capture id={}", savedId);
      } catch (Exception e) {
        log.error("Failed to create notification for capture id={}", savedId, e);
      }
    } else {
      log.warn("Capture saved but getId() returned null — notification skipped");
    }
    return saved;
  }

  /**
   * Get all captures from the database
   *
   * @return list of all captures
   */
  public List<Capture> getCaptures() {
    return captureRepository.findAll();
  }

  public Optional<Capture> getCaptureById(@NonNull String id) {
    return captureRepository.findById(id);
  }

  /**
   * Get captures within a date range
   *
   * @param startDate start date in milliseconds
   * @param endDate end date in milliseconds
   * @return list of captures within the date range
   */
  public List<Capture> getCapturesByDateRange(long startDate, long endDate) {
    return captureRepository.findByDateRange(startDate, endDate);
  }

  public void deleteCapture(@NonNull String id) {
    captureRepository.deleteById(id);
  }

  /**
   * Update an existing capture
   *
   * @param id the capture ID to update
   * @param capture the updated capture data
   * @return the updated capture
   */
  public @NonNull Capture updateCapture(@NonNull String id, @NonNull Capture capture) {
    capture.setId(id);
    return captureRepository.save(capture);
  }
}
