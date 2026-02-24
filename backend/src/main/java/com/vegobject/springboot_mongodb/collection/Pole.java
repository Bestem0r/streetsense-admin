package com.vegobject.springboot_mongodb.collection;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

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
  // @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
  private Geometry gps;

  @Field("location")
  @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
  private GeoJsonPoint location;
  private List<ImageInfo> images = new ArrayList<>();
}
