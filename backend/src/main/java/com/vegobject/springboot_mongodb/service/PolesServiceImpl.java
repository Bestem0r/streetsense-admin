package com.vegobject.springboot_mongodb.service;

import com.mongodb.client.AggregateIterable;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.vegobject.springboot_mongodb.collection.CapturedDates;
import com.vegobject.springboot_mongodb.collection.Pole;
import com.vegobject.springboot_mongodb.repository.PolesRepository;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.stereotype.Service;

@Service
public class PolesServiceImpl implements PolesService {

  @Autowired private PolesRepository polesRepository;

  @Autowired private MongoTemplate mongoTemplate;

  @Value("${spring.data.mongodb.uri}")
  private String mongoUri;

  public Pole[] getPoles() {
    return polesRepository.findAll().toArray(Pole[]::new);
  }

  public Pole[] getPolesByDate(long cdate) {
    LocalDate date = Instant.ofEpochSecond(cdate)
            .atZone(ZoneOffset.UTC)
            .toLocalDate();
    long startOfDay = date.atStartOfDay(ZoneOffset.UTC).toEpochSecond();
    long endOfDay = date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toEpochSecond();
    return polesRepository
            .findAllByCapturedDateBetween(startOfDay, endOfDay)
            .toArray(Pole[]::new);
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

  public void deletePoleById(String id) {
    try {
      polesRepository.deleteById(id);
    } catch (Exception e) {
      throw new RuntimeException("Error deleting pole with id: " + id, e);
    }}

  public Pole getPoleById(String id) {
    try {
      return polesRepository.findById(id).orElseThrow(() -> new RuntimeException("Pole not found with id: " + id));
    } catch (Exception e) {
      throw new RuntimeException("Error retrieving pole with id: " + id, e);
    }
  }

  @Override
public Pole updatePole(String id, Pole updatedPole) {
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
