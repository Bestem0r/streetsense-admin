package com.vegobject.springboot_mongodb.dto;

import java.util.List;

public record InspectorStatsResponse(
    long totalAssigned,
    long inspectedCount,
    List<ActionStat> byAction,
    List<CountyStat> byCounty,
    List<MunicipalityStat> byMunicipality,
    List<RecentActivity> recentActivity
) {
  public record ActionStat(String action, int count) {}
  public record CountyStat(String county, int count) {}
  public record MunicipalityStat(String municipality, int count) {}
  public record RecentActivity(String poleId, String county, String action, Long inspectionDate) {}
}
