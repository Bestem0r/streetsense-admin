package com.vegobject.springboot_mongodb.service;

import com.vegobject.springboot_mongodb.collection.CapturedDates;
import com.vegobject.springboot_mongodb.collection.Pole;

public interface PolesService {

  Pole[] getPoles();

  Pole getPoleById(String id);

  

  PoleSummaryResponse getSummary();

  CapturedDates getCapturedDateStrings();

  Pole[] getPolesNear(String capturedData, double longitude, double latitude);
  void deletePoleById(String id);
  Pole updatePole(String id, Pole updatedPole);
  
  // change all capturedDate values to unix timestamps
  /* void updateCapturedDatesToUnixTimestamps(); */
}
