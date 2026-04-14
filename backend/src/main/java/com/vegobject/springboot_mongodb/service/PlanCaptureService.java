package com.vegobject.springboot_mongodb.service;

import com.vegobject.springboot_mongodb.collection.Capture;
import com.vegobject.springboot_mongodb.repository.CaptureRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

@Service
public class PlanCaptureService {

  @Autowired
  private CaptureRepository captureRepository;

  /**
   * Add a new capture to the database
   *
   * @param capture the capture object to save
   * @return the saved capture with generated ID
   */
  public @NonNull Capture addCapture(@NonNull Capture capture) {
    return captureRepository.save(capture);
  }

  /**
   * Get all captures from the database
   *
   * @return list of all captures
   */
  public List<Capture> getCaptures() {
    return captureRepository.findAll();
  }

  /**
   * Get captures by groupBy field
   *
   * @param groupBy the groupBy field value
   * @return list of captures matching the groupBy
   */
  public List<Capture> getCapturesByGroupBy(String groupBy) {
    return captureRepository.findByGroupBy(groupBy);
  }

  /**
   * Get captures by groupBy and GroupByValue
   *
   * @param groupBy the groupBy field value
   * @param groupByValue the GroupByValue field value
   * @return list of captures matching both criteria
   */
  public List<Capture> getCapturesByGroupByAndValue(String groupBy, String groupByValue) {
    return captureRepository.findByGroupByAndValue(groupBy, groupByValue);
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

  /**
   * Get a capture by ID
   *
   * @param id the capture ID
   * @return optional containing the capture if found
   */
  public Optional<Capture> getCaptureById(@NonNull String id) {
    return captureRepository.findById(id);
  }

  /**
   * Delete a capture by ID
   *
   * @param id the capture ID to delete
   */
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
