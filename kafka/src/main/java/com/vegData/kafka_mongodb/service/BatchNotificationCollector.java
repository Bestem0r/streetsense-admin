package com.vegData.kafka_mongodb.service;

import com.vegData.kafka_mongodb.collection.Pole;
import java.util.ArrayList;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;
import java.util.function.Consumer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Collects poles from Kafka into batches and emits them after a timeout or when batch reaches min size.
 * This prevents creating a notification for every single pole capture.
 */
@Service
@Slf4j
public class BatchNotificationCollector {

  private final List<Pole> batchBuffer = new ArrayList<>();
  private Timer batchTimer;
  private Consumer<List<Pole>> onBatchReady;

  // Configuration
  private int minBatchSize = 2; // Minimum poles before emitting batch
  private long batchTimeoutMs = 5000; // 5 seconds - max wait time for batch

  public BatchNotificationCollector() {}

  /**
   * Set the callback to invoke when batch is ready
   */
  public void setOnBatchReady(Consumer<List<Pole>> callback) {
    this.onBatchReady = callback;
  }

  /**
   * Add a single pole to the batch
   */
  public synchronized void addPole(Pole pole) {
    batchBuffer.add(pole);
    log.debug("Added pole to batch. Current batch size: {}", batchBuffer.size());

    // If batch reaches minimum size, emit immediately
    if (batchBuffer.size() >= minBatchSize) {
      log.info("Batch size reached minimum ({}), emitting immediately", minBatchSize);
      emitBatch();
    } else {
      // Schedule timeout if not already scheduled
      if (batchTimer == null) {
        scheduleBatchTimeout();
      }
    }
  }

  /**
   * Add multiple poles at once
   */
  public synchronized void addPoles(List<Pole> poles) {
    if (poles == null || poles.isEmpty()) {
      return;
    }
    batchBuffer.addAll(poles);
    log.debug("Added {} poles to batch. Current batch size: {}", poles.size(), batchBuffer.size());

    if (batchBuffer.size() >= minBatchSize) {
      log.info("Batch size reached minimum ({}), emitting immediately", minBatchSize);
      emitBatch();
    } else {
      if (batchTimer == null) {
        scheduleBatchTimeout();
      }
    }
  }

  /**
   * Schedule a timeout to emit batch even if not full
   */
  private void scheduleBatchTimeout() {
    batchTimer = new Timer();
    batchTimer.schedule(
        new TimerTask() {
          @Override
          public void run() {
            synchronized (BatchNotificationCollector.this) {
              if (batchBuffer.size() > 0) {
                log.info("Batch timeout reached, emitting {} poles", batchBuffer.size());
                emitBatch();
              }
            }
          }
        },
        batchTimeoutMs);
  }

  /**
   * Emit the batch and reset
   */
  private synchronized void emitBatch() {
    if (batchBuffer.isEmpty()) {
      return;
    }

    List<Pole> batch = new ArrayList<>(batchBuffer);
    batchBuffer.clear();

    // Cancel timer
    if (batchTimer != null) {
      batchTimer.cancel();
      batchTimer = null;
    }

    // Invoke callback
    if (onBatchReady != null) {
      try {
        onBatchReady.accept(batch);
      } catch (Exception e) {
        log.error("Error processing batch", e);
      }
    }
  }

  /**
   * Manually flush the batch
   */
  public synchronized void flush() {
    if (batchBuffer.size() > 0) {
      log.info("Flushing batch with {} poles", batchBuffer.size());
      emitBatch();
    }
  }

  /**
   * Configure batch settings
   */
  public void configure(int minSize, long timeoutMs) {
    this.minBatchSize = minSize;
    this.batchTimeoutMs = timeoutMs;
    log.info("Batch collector configured: minSize={}, timeoutMs={}", minSize, timeoutMs);
  }

  /**
   * Get current batch size
   */
  public synchronized int getCurrentBatchSize() {
    return batchBuffer.size();
  }

  /**
   * Get a copy of current batch buffer
   */
  public synchronized List<Pole> getBatchBuffer() {
    return new ArrayList<>(batchBuffer);
  }
}
