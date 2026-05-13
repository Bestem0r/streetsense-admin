package com.vegobject.springboot_mongodb.repository;

import com.vegobject.springboot_mongodb.collection.CapturedDates;
import com.vegobject.springboot_mongodb.collection.Pole;
import java.util.List;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface PolesRepository extends MongoRepository<Pole, String> {

  @Aggregation(
      pipeline = {
        "{'$group':{ '_id': null, 'capturedDates': {'$addToSet': '$capturedDate'}}}",
        "{'$project': {'_id': 0}}"
      })
  CapturedDates findAllCapturedDate();

  @Query("{capturedDate:'?0'}")
  List<Pole> findAllByCapturedDate(String capturedDate);

  @Query("{ 'capturedDate': { $gte: ?0, $lt: ?1 } }")
List<Pole> findAllByCapturedDateBetween(long start, long end);

  @Aggregation(
      pipeline = {
        "{'$geoNear': {",
        " 'near': {",
        "   'type': 'Point',",
        "   'coordinates': [ 13.199808267120028,65.83362894630547]",
        " },",
        " 'distanceField': 'distance',",
        " 'maxDistance': 1,",
        " 'spherical': true",
        "}}"
      })
  List<Pole> findNearestPoles(String capturedData, double longitude, double latitude);

  @Aggregation(
      pipeline = {
        "{'$match': { '_id': '?0' }}"
      })
  Pole findPoleById(String id);

  List<Pole> findByAssignedInspector(String assignedInspector);

}
