package com.vegobject.springboot_mongodb.service;

import com.mongodb.client.AggregateIterable;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.vegobject.springboot_mongodb.collection.CapturedDates;
import com.vegobject.springboot_mongodb.collection.Pole;
import com.vegobject.springboot_mongodb.dto.PagedPolesResponse;
import com.vegobject.springboot_mongodb.dto.PoleSummaryResponse;
import com.vegobject.springboot_mongodb.dto.PoleSummaryResponse.CountyData;
import com.vegobject.springboot_mongodb.dto.PoleSummaryResponse.DateCount;
import com.vegobject.springboot_mongodb.repository.PolesRepository;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

@Service
public class PolesServiceImpl implements PolesService {

  @Autowired private PolesRepository polesRepository;
  @Autowired private MongoTemplate mongoTemplate;

  @Value("${spring.data.mongodb.uri}")
  private String mongoUri;

  @Override
  public Pole[] getPoles() {
    return polesRepository.findAll().toArray(Pole[]::new);
  }
@Override
  public PagedPolesResponse getPolesByDate(String date, int page, int size, String counties, String municipalities) {
    Query baseQuery = buildDateQuery(date, counties, municipalities);
    long totalElements = mongoTemplate.count(buildDateQuery(date, counties, municipalities), Pole.class);

    baseQuery.skip((long) page * size).limit(size);
    List<Pole> content = mongoTemplate.find(baseQuery, Pole.class);

    boolean hasMore = (long) (page + 1) * size < totalElements;
    return new PagedPolesResponse(content, page, size, totalElements, hasMore);
  }

  private Query buildDateQuery(String date, String counties, String municipalities) {
    Query query = new Query();
    if (date != null && !date.isBlank()) {
      LocalDate localDate = LocalDate.parse(date);
      long startOfDay = localDate.atStartOfDay(ZoneOffset.UTC).toEpochSecond() * 1000;
      long endOfDay = localDate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toEpochSecond() * 1000;
      query.addCriteria(Criteria.where("capturedDate").gte(startOfDay).lt(endOfDay));
    }
    List<String> countyList = parseCsv(counties);
    if (!countyList.isEmpty()) {
      query.addCriteria(Criteria.where("county").in(countyList));
    }
    List<String> municipalityList = parseCsv(municipalities);
    if (!municipalityList.isEmpty()) {
      query.addCriteria(Criteria.where("municipality").in(municipalityList));
    }
    return query;
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

  @Override
  public CapturedDates getCapturedDateStrings() {
    return polesRepository.findAllCapturedDate();
  }

  @Override
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

  @Override
  public void deletePoleById(String id) {
    try {
      polesRepository.deleteById(id);
    } catch (Exception e) {
      throw new RuntimeException("Error deleting pole with id: " + id, e);
    }
  }

  @Override
  public Pole getPoleById(String id) {
    try {
      return polesRepository.findById(id)
          .orElseThrow(() -> new RuntimeException("Pole not found with id: " + id));
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

  private List<String> parseCsv(String input) {
    if (input == null || input.isBlank()) {
      return List.of();
    }

    return Arrays.stream(input.split(","))
        .map(String::trim)
        .filter(value -> !value.isBlank())
        .distinct()
        .toList();
  }

  private Criteria buildStatusCriteria(List<String> statuses) {
    if (statuses.isEmpty()) {
      return null;
    }

    List<Criteria> criteria = new ArrayList<>();

    if (statuses.contains("inspected")) {
      criteria.add(Criteria.where("images.0.inspectionStatus").regex("^inspected$", "i"));
    }

    if (statuses.contains("not_inspected")) {
      criteria.add(
          new Criteria().orOperator(
              Criteria.where("images.0.inspectionStatus").exists(false),
              Criteria.where("images.0.inspectionStatus").regex("^not inspected$", "i")));
    }

    if (criteria.isEmpty()) {
      return null;
    }

    if (criteria.size() == 1) {
      return criteria.get(0);
    }

    return new Criteria().orOperator(criteria.toArray(new Criteria[0]));
  }

  private List<String> sanitizeStringList(List<String> values) {
    if (values == null) {
      return List.of();
    }

    return values.stream()
        .filter(value -> value != null && !value.isBlank())
        .distinct()
        .sorted()
        .toList();
  }
}
