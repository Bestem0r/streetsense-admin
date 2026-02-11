package com.vegData.kafka_mongodb.repository;

import com.vegData.kafka_mongodb.collection.Pole;
import java.util.List;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PolesRepository extends MongoRepository<Pole, String> {

  @Aggregation(
      pipeline = {
        "{'$geoNear': { 'near': {'type': 'Point','coordinates': [ ?0,?1] },'distanceField': 'distance','maxDistance': 5,'spherical': false}}"
      })
  List<Pole> findNearestPoles(double longitude, double latitude);

  /**
   * Finds the nearest pole to avoid duplicate pole entries in the database.
   *
   * @param longitude longitude of the point to search near
   * @param latitude latitude of the point to search near
   * @return the nearest pole to the given longitude and latitude, within a maximum distance of 5
   *     units. If no pole is found within the specified distance, it returns null.
   */
  @Aggregation(
      pipeline = {
        "{'$geoNear': { 'near': {'type': 'Point','coordinates': [ ?0,?1] },'distanceField': 'distance','maxDistance': 5,'spherical': false}}",
        "{'$sort': {'distance': 1}}",
        "{'$limit': 1}"
      })
  Pole findNearestPole(double longitude, double latitude);

  /**
   * @param poleId the poleId to search for
   * @return the pole with the specified poleId. If no pole is found with the given poleId, it
   *     returns null.
   */
  @Aggregation(pipeline = {"{'$match': {'_id': ?0}}"})
  Pole findByPoleId(String poleId);
}
