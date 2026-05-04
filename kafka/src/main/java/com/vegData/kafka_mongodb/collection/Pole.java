package com.vegData.kafka_mongodb.collection;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "kafkaMsg")
@JsonInclude(JsonInclude.Include.NON_NULL)
@AllArgsConstructor
@NoArgsConstructor
public class Pole {
  @Id private String id;
  private double altitude;
  private int speed;
  private int fixType;
  private double courseOverGround;
  private double hdop;
  private Long capturedDate;
  private Geometry gps;
  private GeoJsonPoint location;
  private String county;
  private String municipality;
  private String roadCategory;
  private Integer roadNumber;
  private Double distanceFromRoad;
  private double fieldOfView;
  private int satellitesUsed;
  private List<ImageInfo> images = new ArrayList<>();
}
