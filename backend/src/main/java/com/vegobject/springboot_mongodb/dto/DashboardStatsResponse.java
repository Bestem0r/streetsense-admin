package com.vegobject.springboot_mongodb.dto;

import java.util.List;

public record DashboardStatsResponse(
    long totalPoles,
    long inspectedCount,
    List<DateCount> captureDates,
    List<CountyStat> byCounty,
    List<InspectorStat> byInspector,
    List<RecentInspection> recentInspections
) {
  public record DateCount(long capturedDate, int count) {}
  public record CountyStat(String county, int count) {}
  public record InspectorStat(String inspectorId, int inspected, int pending) {}
  public record RecentInspection(String poleId, String county, String action, String assignedInspector, Long inspectionDate) {}
}
