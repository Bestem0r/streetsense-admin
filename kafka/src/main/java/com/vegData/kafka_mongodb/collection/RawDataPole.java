package com.vegData.kafka_mongodb.collection;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.mongodb.core.mapping.Field;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;

@Data
@JsonInclude
public class RawDataPole {
    @Field("id")
    private String poleId;
    private String capturedDate;
    private NmeaInfo nmeaInfo;
    private CameraInfo cameraInfo;
    private List<byte[]> imageBytes = new ArrayList<>();
}
