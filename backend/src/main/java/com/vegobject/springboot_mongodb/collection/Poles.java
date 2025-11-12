package com.vegobject.springboot_mongodb.collection;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Document(collection = "kafkaMsg")
@JsonInclude(JsonInclude.Include.NON_NULL)
@AllArgsConstructor
@NoArgsConstructor
public class Poles {

    @Id
    private String id;
    @Field("poleId")
    private String poleId;
    private double altitude;
    private int speed;
    private int fixType;
    private double courseOverGround;
    private double hdop;
    private String capturedDate;
    // @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    private Geometry gps;
    @Field("location")
    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    private GeoJsonPoint location;
}
