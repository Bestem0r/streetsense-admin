package com.vegobject.springboot_mongodb.service;

import com.mongodb.client.AggregateIterable;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.vegobject.springboot_mongodb.collection.CapturedDates;
import com.vegobject.springboot_mongodb.collection.Pole;
import com.vegobject.springboot_mongodb.repository.PolesRepository;

import io.micrometer.common.lang.NonNull;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.stereotype.Service;

@Service
public class PolesServiceImpl implements PolesService {

  @Autowired private PolesRepository polesRepository;

  @Value("${spring.data.mongodb.uri}")
  private String mongoUri;

  public Pole[] getPoles() {
    return polesRepository.findAll().toArray(Pole[]::new);
  }

  

  

  @Override
  public PoleSummaryResponse getSummary() {
    Aggregation dateAggregation =
        Aggregation.newAggregation(
            Aggregation.group("capturedDate").count().as("count"),
            Aggregation.project("count").and("_id").as("capturedDate"),
            Aggregation.sort(Sort.Direction.DESC, "capturedDate"));

    AggregationResults<Document> dateResults =
        mongoTemplate.aggregate(dateAggregation, "kafkaMsg", Document.class);

    List<DateCount> dates =
        dateResults.getMappedResults().stream()
            .map(doc -> new DateCount(doc.getLong("capturedDate"), doc.getInteger("count")))
            .toList();

    Aggregation countyAggregation =
        Aggregation.newAggregation(
            Aggregation.match(
                Criteria.where("county").ne(null).ne("").and("municipality").ne(null).ne("")),
            Aggregation.group("county").addToSet("municipality").as("municipalities"),
            Aggregation.project("municipalities").and("_id").as("county"),
            Aggregation.sort(Sort.Direction.ASC, "county"));

    AggregationResults<Document> countyResults =
        mongoTemplate.aggregate(countyAggregation, "kafkaMsg", Document.class);

    List<CountyData> countyData =
        countyResults.getMappedResults().stream()
            .map(
                doc ->
                    new CountyData(
                        doc.getString("county"),
                        sanitizeStringList(doc.getList("municipalities", String.class))))
            .toList();

    List<String> availableCounties =
        countyData.stream().map(CountyData::county).filter(value -> value != null && !value.isBlank()).toList();

    List<String> availableMunicipalities =
        countyData.stream()
            .map(CountyData::municipalities)
            .flatMap(Collection::stream)
            .filter(value -> value != null && !value.isBlank())
            .distinct()
            .sorted()
            .toList();

    return new PoleSummaryResponse(dates, countyData, availableCounties, availableMunicipalities);
}

  public CapturedDates getCapturedDateStrings() {
    return polesRepository.findAllCapturedDate();
  }

  public Pole[] getPolesNear(String capturedData, double longitude, double latitude) {
    MongoClient mongoClient = MongoClients.create(mongoUri);
    MongoDatabase database = mongoClient.getDatabase("vegobject");
    MongoCollection<Document> collection = database.getCollection("kafkaMsg");
    try {

      AggregateIterable<Document> result =
          collection.aggregate(
              Arrays.asList(
                  new Document(
                      "$geoNear",
                      new Document(
                              "near",
                              new Document("type", "Point")
                                  .append("coordinates", Arrays.asList(longitude, latitude)))
                          .append("distanceField", "dist")
                          .append("maxDistance", 1L)
                          .append("includeLocs", "loca")
                          .append("spherical", true)),
                  new Document("$match", new Document("capturedDate", capturedData))));

      result.forEach(doc -> System.out.println("nearby pole: " + doc.toJson()));

      List<Pole> nearbyPoles = new ArrayList<>();
      result.forEach(
          doc -> {
            Pole pole = new Pole();
            pole.setAltitude(doc.getDouble("altitude"));
            pole.setSpeed(doc.getInteger("speed"));
            pole.setFixType(doc.getInteger("fixType"));
            pole.setCourseOverGround(doc.getDouble("courseOverGround"));
            pole.setHdop(doc.getDouble("hdop"));
            pole.setCapturedDate(doc.getLong("capturedDate"));
            pole.setLocation(
                new GeoJsonPoint(
                    doc.get("loca", Document.class).getList("coordinates", Double.class).get(0),
                    doc.get("loca", Document.class).getList("coordinates", Double.class).get(1)));
            nearbyPoles.add(pole);
          });
      return nearbyPoles.toArray(Pole[]::new);
    } catch (Exception e) {
      throw new RuntimeException("Error retrieving nearby poles", e);
    } finally {
      mongoClient.close();
    }
  }

  @SuppressWarnings("null")
  public void deletePoleById(@NonNull String id) {
    try {
      polesRepository.deleteById(id);
    } catch (Exception e) {
      throw new RuntimeException("Error deleting pole with id: " + id, e);
    }}

  @SuppressWarnings("null")
  public Pole getPoleById(@NonNull String id) {
    try {
      return polesRepository.findById(id).orElseThrow(() -> new RuntimeException("Pole not found with id: " + id));
    } catch (Exception e) {
      throw new RuntimeException("Error retrieving pole with id: " + id, e);
    }
  }

  @Override
public Pole updatePole(@NonNull String id, @NonNull Pole updatedPole) {
  try {
    updatedPole.setId(id);
    updatedPole.setLastModified(System.currentTimeMillis());
    System.out.println(updatedPole.toString());
    return polesRepository.save(updatedPole);
  } catch (Exception e) {
    throw new RuntimeException("Error updating pole with id: " + id, e);
  }
}
  

  
}
