package com.vegobject.springboot_mongodb.service;

import com.vegobject.springboot_mongodb.collection.CapturedDates;
import com.vegobject.springboot_mongodb.collection.Pole;
import com.vegobject.springboot_mongodb.dto.PagedPolesResponse;
import com.vegobject.springboot_mongodb.dto.PoleSummaryResponse;

public interface PolesService {

  Pole[] getPoles();

  Pole getPoleById(String id);

  PagedPolesResponse getPolesByDate(String date, int page, int size, String counties, String municipalities);

  PoleSummaryResponse getSummary(String counties, String municipalities);

  CapturedDates getCapturedDateStrings();

  Pole[] getPolesNear(String capturedData, double longitude, double latitude);
  void deletePoleById(String id);
  Pole updatePole(String id, Pole updatedPole);
  
  // change all capturedDate values to unix timestamps
  /* void updateCapturedDatesToUnixTimestamps(); */
}
