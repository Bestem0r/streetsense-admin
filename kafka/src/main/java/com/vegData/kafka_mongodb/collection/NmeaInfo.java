package com.vegData.kafka_mongodb.collection;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@AllArgsConstructor
@NoArgsConstructor
public class NmeaInfo {

    private double latitude;
    private double longitude;
    private double altitude;
    private int satellitesUsed;
    private int fixType;
    private double hdop;
    private double courseOverGround;
    private double speedOverGround;
}
