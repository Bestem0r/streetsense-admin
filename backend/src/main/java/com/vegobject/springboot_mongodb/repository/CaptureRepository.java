package com.vegobject.springboot_mongodb.repository;

import com.vegobject.springboot_mongodb.collection.Capture;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface CaptureRepository extends MongoRepository<Capture, String> {

  @Query("{ 'startDate': { $gte: ?0, $lt: ?1 } }")
  List<Capture> findByDateRange(long startDate, long endDate);
}
