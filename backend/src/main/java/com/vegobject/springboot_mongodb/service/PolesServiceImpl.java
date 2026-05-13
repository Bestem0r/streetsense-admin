package com.vegobject.springboot_mongodb.service;

import com.mongodb.client.AggregateIterable;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.vegobject.springboot_mongodb.collection.CapturedDates;
import com.vegobject.springboot_mongodb.collection.Pole;

import com.vegobject.springboot_mongodb.dto.InspectorStatsResponse;

import com.vegobject.springboot_mongodb.dto.PagedPolesResponse;
import com.vegobject.springboot_mongodb.dto.PoleSummaryResponse;
import com.vegobject.springboot_mongodb.dto.PoleSummaryResponse.CountyData;
import com.vegobject.springboot_mongodb.dto.PoleSummaryResponse.DateCount;
import com.vegobject.springboot_mongodb.repository.PolesRepository;

import com.vegobject.springboot_mongodb.collection.ImageInfo;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Comparator;
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
  public java.util.List<Pole> getPolesByInspector(String inspectorId) {
    return polesRepository.findByAssignedInspector(inspectorId);
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
  public PoleSummaryResponse getSummary(String counties, String municipalities) {
    List<String> countyList = parseCsv(counties);
    List<String> municipalityList = parseCsv(municipalities);

    List<org.springframework.data.mongodb.core.aggregation.AggregationOperation> dateOps = new ArrayList<>();
    if (!countyList.isEmpty() || !municipalityList.isEmpty()) {
      Criteria filter = new Criteria();
      if (!countyList.isEmpty() && !municipalityList.isEmpty()) {
        filter = new Criteria().andOperator(
            Criteria.where("county").in(countyList),
            Criteria.where("municipality").in(municipalityList));
      } else if (!countyList.isEmpty()) {
        filter = Criteria.where("county").in(countyList);
      } else {
        filter = Criteria.where("municipality").in(municipalityList);
      }
      dateOps.add(Aggregation.match(filter));
    }
    dateOps.add(Aggregation.group("capturedDate").count().as("count"));
    dateOps.add(Aggregation.project("count").and("_id").as("capturedDate"));
    dateOps.add(Aggregation.sort(Sort.Direction.DESC, "capturedDate"));

    Aggregation dateAggregation = Aggregation.newAggregation(dateOps);

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
      Pole saved = polesRepository.save(updatedPole);
      checkConsecutivePoles(saved);
      return saved;
    } catch (Exception e) {
      throw new RuntimeException("Error updating pole with id: " + id, e);
    }
  }

  private static final double CONSECUTIVE_RADIUS_METERS = 50.0;

  private void checkConsecutivePoles(Pole pole) {
    if (pole.getLocation() == null || pole.getImages() == null) return;

    List<ImageInfo> replaceImages = pole.getImages().stream()
        .filter(img -> "Replace".equals(img.getAction()) && img.getCapturedDate() != null)
        .toList();

    if (replaceImages.isEmpty()) return;

    Query query = new Query(
        Criteria.where("location").nearSphere(pole.getLocation())
            .maxDistance(CONSECUTIVE_RADIUS_METERS)
            .and("_id").ne(pole.getId())
    );

    List<Pole> neighbors = mongoTemplate.find(query, Pole.class);

    for (Pole neighbor : neighbors) {
      boolean sameRoad = java.util.Objects.equals(pole.getRoadNumber(), neighbor.getRoadNumber())
          && java.util.Objects.equals(pole.getRoadCategory(), neighbor.getRoadCategory());
      if (!sameRoad || neighbor.getImages() == null) continue;

      boolean neighborModified = false;
      boolean poleModified = false;

      for (ImageInfo replaceImage : replaceImages) {
        Long capturedDate = replaceImage.getCapturedDate();
        ImageInfo neighborMatch = neighbor.getImages().stream()
            .filter(img -> img.getCapturedDate() != null
                && sameDay(capturedDate, img.getCapturedDate())
                && "Replace".equals(img.getAction()))
            .findFirst().orElse(null);

        if (neighborMatch != null) {
          applyConsecutiveDueDate(replaceImage);
          applyConsecutiveDueDate(neighborMatch);
          poleModified = true;
          neighborModified = true;
        }
      }

      if (poleModified) polesRepository.save(pole);
      if (neighborModified) polesRepository.save(neighbor);
    }
  }

  private ImageInfo getLatestImage(Pole pole) {
    if (pole.getImages() == null || pole.getImages().isEmpty()) return null;
    return pole.getImages().stream()
        .max(Comparator.comparingLong(img -> img.getCapturedDate() != null ? img.getCapturedDate() : 0L))
        .orElse(null);
  }

  private boolean sameDay(long a, long b) {
    return java.time.Instant.ofEpochMilli(a).atZone(java.time.ZoneOffset.UTC).toLocalDate()
        .equals(java.time.Instant.ofEpochMilli(b).atZone(java.time.ZoneOffset.UTC).toLocalDate());
  }

  private void applyConsecutiveDueDate(ImageInfo image) {
    long capturedDate = image.getCapturedDate() != null ? image.getCapturedDate() : 0L;
    image.setDueDate(capturedDate + 14L * 24 * 60 * 60 * 1000);
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

  

  @Override
  public InspectorStatsResponse getInspectorStats(String inspectorId) {
    MongoClient mongoClient = MongoClients.create(mongoUri);
    MongoDatabase database = mongoClient.getDatabase("vegobject");
    MongoCollection<Document> collection = database.getCollection("kafkaMsg");
    try {
      Document matchStage = new Document("$match", new Document("assignedInspector", inspectorId));

      Document latestImageExpr = new Document("$reduce", new Document()
          .append("input", new Document("$ifNull", Arrays.asList("$images", new ArrayList<>())))
          .append("initialValue", null)
          .append("in", new Document("$cond", Arrays.asList(
              new Document("$or", Arrays.asList(
                  new Document("$eq", Arrays.asList("$$value", null)),
                  new Document("$gt", Arrays.asList("$$this.capturedDate", "$$value.capturedDate"))
              )),
              "$$this",
              "$$value"
          )))
      );
      Document addFieldsStage = new Document("$addFields", new Document("latestImage", latestImageExpr));

      Document facetStage = new Document("$facet", new Document()
          .append("totalCount", Arrays.asList(
              new Document("$count", "count")
          ))
          .append("inspectedCount", Arrays.asList(
              new Document("$match", new Document("latestImage.inspectionStatus", "Inspected")),
              new Document("$count", "count")
          ))
          .append("byAction", Arrays.asList(
              new Document("$group", new Document("_id", "$latestImage.action").append("count", new Document("$sum", 1))),
              new Document("$project", new Document("action", new Document("$ifNull", Arrays.asList("$_id", "Not Inspected"))).append("count", 1).append("_id", 0)),
              new Document("$sort", new Document("count", -1))
          ))
          .append("byCounty", Arrays.asList(
              new Document("$group", new Document("_id", "$county").append("count", new Document("$sum", 1))),
              new Document("$match", new Document("_id", new Document("$nin", Arrays.asList(null, "")))),
              new Document("$project", new Document("county", "$_id").append("count", 1).append("_id", 0)),
              new Document("$sort", new Document("count", -1))
          ))
          .append("byMunicipality", Arrays.asList(
              new Document("$group", new Document("_id", "$municipality").append("count", new Document("$sum", 1))),
              new Document("$match", new Document("_id", new Document("$nin", Arrays.asList(null, "")))),
              new Document("$project", new Document("municipality", "$_id").append("count", 1).append("_id", 0)),
              new Document("$sort", new Document("count", -1))
          ))
          .append("recentActivity", Arrays.asList(
              new Document("$match", new Document("latestImage.inspectionStatus", "Inspected")),
              new Document("$sort", new Document("lastModified", -1)),
              new Document("$limit", 8),
              new Document("$project", new Document()
                  .append("poleId", new Document("$toString", "$_id"))
                  .append("county", 1)
                  .append("action", "$latestImage.action")
                  .append("inspectionDate", "$latestImage.inspectionDate")
                  .append("_id", 0)
              )
          ))
      );

      Document facetResult = collection.aggregate(Arrays.asList(matchStage, addFieldsStage, facetStage)).first();
      if (facetResult == null) {
        return new com.vegobject.springboot_mongodb.dto.InspectorStatsResponse(0, 0, List.of(), List.of(), List.of(), List.of());
      }

      List<Document> totalDocs = facetResult.getList("totalCount", Document.class);
      long total = totalDocs.isEmpty() ? 0 : totalDocs.get(0).getInteger("count", 0);

      List<Document> inspectedDocs = facetResult.getList("inspectedCount", Document.class);
      long inspected = inspectedDocs.isEmpty() ? 0 : inspectedDocs.get(0).getInteger("count", 0);

      List<InspectorStatsResponse.ActionStat> byAction =
          facetResult.getList("byAction", Document.class).stream()
              .map(d -> new InspectorStatsResponse.ActionStat(
                  d.getString("action"), d.getInteger("count", 0)))
              .toList();

      List<InspectorStatsResponse.CountyStat> byCounty =
          facetResult.getList("byCounty", Document.class).stream()
              .map(d -> new InspectorStatsResponse.CountyStat(
                  d.getString("county"), d.getInteger("count", 0)))
              .toList();

      List<InspectorStatsResponse.MunicipalityStat> byMunicipality =
          facetResult.getList("byMunicipality", Document.class).stream()
              .map(d -> new InspectorStatsResponse.MunicipalityStat(
                  d.getString("municipality"), d.getInteger("count", 0)))
              .toList();

      List<InspectorStatsResponse.RecentActivity> recentActivity =
          facetResult.getList("recentActivity", Document.class).stream()
              .map(d -> new InspectorStatsResponse.RecentActivity(
                  d.getString("poleId"),
                  d.getString("county"),
                  d.getString("action"),
                  d.getLong("inspectionDate")))
              .toList();

      return new InspectorStatsResponse(
          total, inspected, byAction, byCounty, byMunicipality, recentActivity);
    } finally {
      mongoClient.close();
    }
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
