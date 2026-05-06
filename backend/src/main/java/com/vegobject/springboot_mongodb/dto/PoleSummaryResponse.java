package com.vegobject.springboot_mongodb.dto;

import java.util.List;

public record PoleSummaryResponse(
    List<DateCount> dates,
  List<CountyData> countyData,
  List<String> availableCounties,
  List<String> availableMunicipalities) {

  public record DateCount(long capturedDate, int count) {}
  public record CountyData(String county, List<String> municipalities) {}
}
