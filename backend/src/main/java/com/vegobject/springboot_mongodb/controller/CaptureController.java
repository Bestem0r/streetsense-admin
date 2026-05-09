package com.vegobject.springboot_mongodb.controller;

import com.vegobject.springboot_mongodb.collection.Capture;
import com.vegobject.springboot_mongodb.service.PlanCaptureService;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.lang.NonNull;

@RestController
@RequestMapping("/captures")
@CrossOrigin(
    origins = {
      "http://localhost:4200",
      "http://localhost:8080",
      "http://dt10.idi.ntnu.no",
      "http://dt14.idi.ntnu.no:8080"
    })
public class CaptureController {

  @Autowired private PlanCaptureService planCaptureService;

  /**
   * Get all captures
   *
   * @return list of all captures
   */
  @GetMapping
  public List<Capture> getCaptures() {
    return planCaptureService.getCaptures();
  }

  /**
   * Get a capture by ID
   *
   * @param id the capture ID
   * @return the capture if found
   */
  @GetMapping("/{id}")
  public Optional<Capture> getCaptureById(@PathVariable @NonNull String id) {
    return planCaptureService.getCaptureById(id);
  }



  /**
   * Get captures within a date range
   *
   * @param startDate the start date (timestamp)
   * @param endDate the end date (timestamp)
   * @return list of captures within the date range
   */
  @GetMapping("/dateRange")
  public List<Capture> getCapturesByDateRange(
      @RequestParam long startDate, @RequestParam long endDate) {
    return planCaptureService.getCapturesByDateRange(startDate, endDate);
  }

  @PostMapping
  public Capture addCapture(@RequestBody @NonNull Capture capture) {
    return planCaptureService.addCaptureRound(capture);
  }

  @PutMapping("/{id}")
  public Capture updateCapture(@PathVariable @NonNull String id, @RequestBody @NonNull Capture updatedCapture) {
    return planCaptureService.updateCapture(id, updatedCapture);
  }

  @DeleteMapping("/{id}")
  public void deleteCapture(@PathVariable @NonNull String id) {
    planCaptureService.deleteCapture(id);
  }
}
