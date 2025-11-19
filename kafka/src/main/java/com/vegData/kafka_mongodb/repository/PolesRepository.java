package com.vegData.kafka_mongodb.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.vegData.kafka_mongodb.collection.Poles;

import org.springframework.stereotype.Repository;

@Repository
public interface PolesRepository extends MongoRepository<Poles, String> {

    @Aggregation(pipeline = {
            "{'$geoNear': { 'near': {'type': 'Point','coordinates': [ ?1,?2] },'distanceField': 'distance','maxDistance': 5,'spherical': false}}"
    })
    List<Poles> findNearestPoles(String capturedData, double longitude, double latitude);
}
