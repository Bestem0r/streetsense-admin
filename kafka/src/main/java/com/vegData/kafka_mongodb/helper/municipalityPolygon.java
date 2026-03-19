package com.vegData.kafka_mongodb.helper;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.locationtech.jts.geom.MultiPolygon;

@Getter
@AllArgsConstructor
public class municipalityPolygon {
  private String name;
  private MultiPolygon geometry;
}
