package com.vegobject.springboot_mongodb.collection;

import lombok.Data;

@Data
public class LocationRequest {

    private String capturedDate;
    private double latitude;
    private double longitude;

}
