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
    Timestamp ts = new Timestamp(cdate);
    SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");
    String captureddate = formatter.format(ts);
    return polesRepository.findAllByCapturedDate(captureddate).toArray(Pole[]::new);
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
            pole.setCapturedDate(doc.getString("capturedDate"));
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
}
