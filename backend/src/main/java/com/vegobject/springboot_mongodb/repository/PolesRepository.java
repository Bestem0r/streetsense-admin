package com.vegobject.springboot_mongodb.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.vegobject.springboot_mongodb.collection.CapturedDates;
import com.vegobject.springboot_mongodb.collection.Poles;

import org.springframework.stereotype.Repository;

@Repository
public interface PolesRepository extends MongoRepository<Poles,String>{

//     @Aggregation(pipeline = {
//         "{'$match':{'transaction_type':?0, 'price': {$gt: ?1} }}",
//         "{'$sample':{size:?2}}",
//         "{'$sort':{'area':-1}}"
// })

    @Aggregation(pipeline = {
        "{'$group':{ '_id': null, 'capturedDates': {'$addToSet': '$capturedDate'}}}",
        "{'$project': {'_id': 0}}"
    })
    CapturedDates findAllCapturedDate();


    @Query("{capturedDate:'?0'}")
    List<Poles> findAllByCapturedDate(String capturedDate);

    @Aggregation(pipeline = {
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
    List<Poles> findNearestPoles(String capturedData, double longitude, double latitude);
}
