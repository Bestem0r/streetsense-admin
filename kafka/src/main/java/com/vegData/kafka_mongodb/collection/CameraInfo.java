package com.vegData.kafka_mongodb.collection;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CameraInfo {
    private double fieldOfView;
}
