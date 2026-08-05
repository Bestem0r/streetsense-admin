package com.vegData.kafka_mongodb.collection;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import org.springframework.data.mongodb.core.mapping.Field;

@Data
@JsonInclude
public class RawDataPole {
  @Field("id")
  private String poleId;
  private String capturedDate;
  private NmeaInfo nmeaInfo;
  private CameraInfo cameraInfo;
  private PoleInfoDTO poleInfo;
  private byte[] imageBytes;
}
