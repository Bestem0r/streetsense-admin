package com.vegData.kafka_mongodb.collection;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;
import org.springframework.data.mongodb.core.mapping.Field;

@Data
@JsonInclude
public class RawDataPole {
  @Field("id")
  private String poleId;
  private Long capturedDate;
  private NmeaInfo nmeaInfo;
  private CameraInfo cameraInfo;
  private List<byte[]> imageBytes = new ArrayList<>();
}
