package com.vegobject.springboot_mongodb.service;

import com.vegobject.springboot_mongodb.collection.CapturedDates;
import com.vegobject.springboot_mongodb.collection.Poles;

public interface PolesService {

    Poles[] getPoles();

    Poles[] getPolesByDate(long cdate);

    CapturedDates getCapturedDateStrings();

    Poles[] getPolesNear(String capturedData, double longitude, double latitude);
}
