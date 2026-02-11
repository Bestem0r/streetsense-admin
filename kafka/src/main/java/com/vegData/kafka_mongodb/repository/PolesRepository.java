package com.vegData.kafka_mongodb.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.vegData.kafka_mongodb.collection.Poles;

import org.springframework.stereotype.Repository;

@Repository
public interface PolesRepository extends MongoRepository<Poles, String> {

    @Aggregation(pipeline = {
            "{'$geoNear': { 'near': {'type': 'Point','coordinates': [ ?0,?1] },'distanceField': 'distance','maxDistance': 5,'spherical': false}}"
    })
    List<Poles> findNearestPoles( double longitude, double latitude);
    
    // nearest pole to a given location
    @Aggregation(pipeline = {
            "{'$geoNear': { 'near': {'type': 'Point','coordinates': [ ?0,?1] },'distanceField': 'distance','maxDistance': 5,'spherical': false}}",
            "{'$sort': {'distance': 1}}",
            "{'$limit': 1}"
    })
    Poles findNearestPole(double longitude, double latitude);

    // get by poleId
    @Aggregation(pipeline = {
            "{'$match': {'_id': ?0}}"
    })
    Poles findByPoleId(String poleId);


}
