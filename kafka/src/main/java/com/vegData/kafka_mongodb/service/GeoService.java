package com.vegData.kafka_mongodb.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vegData.kafka_mongodb.helper.CountyPolygon;
import com.vegData.kafka_mongodb.helper.municipalityPolygon;
import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import org.locationtech.jts.geom.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

@Service
public class GeoService {
  private final GeometryFactory geometryFactory = new GeometryFactory();
  private final List<CountyPolygon> counties = new ArrayList<>();
  private final List<municipalityPolygon> municipalities = new ArrayList<>();

  /**
   * Loads county polygons from a GeoJSON file and stores them in the counties list. Each county is
   * represented as a CountyPolygon object containing its name and geometry. The method reads the
   * GeoJSON file, extracts the relevant properties and coordinates, and constructs MultiPolygon
   * geometries for each county.
   */
  @PostConstruct
  public void loadCounties() {
    try {
      ObjectMapper mapper = new ObjectMapper();
      InputStream is = new ClassPathResource("Fylker_GeoJSON/fylker.geojson").getInputStream();
      JsonNode root = mapper.readTree(is);
      JsonNode features = root.path("Fylke").path("features");

      for (JsonNode feature : features) {
        String name = feature.path("properties").path("fylkesnavn").asText();
        JsonNode coords = feature.path("geometry").path("coordinates");
        MultiPolygon multiPolygon = createMultiPolygon(coords);
        counties.add(new CountyPolygon(name, multiPolygon));
      }
    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  /**
   * Loads municipality polygons from a GeoJSON file and stores them in the municipalities list.
   * Each municipality is represented as a municipalityPolygon object containing its name and
   * geometry. The method reads the GeoJSON file, extracts the relevant properties and coordinates,
   * and constructs MultiPolygon geometries for each municipality.
   */
  @PostConstruct
  public void loadMunicipalities() {
    try {
      ObjectMapper mapper = new ObjectMapper();

      InputStream is = new ClassPathResource("Kommuner_GeoJSON/kommuner.geojson").getInputStream();
      JsonNode root = mapper.readTree(is);

      JsonNode features =
          root.has("Kommune") ? root.path("Kommune").path("features") : root.path("features");

      for (JsonNode feature : features) {
        String name = feature.path("properties").path("kommunenavn").asText();

        JsonNode coords = feature.path("geometry").path("coordinates");

        MultiPolygon multiPolygon = createMultiPolygon(coords);

        municipalities.add(new municipalityPolygon(name, multiPolygon));
      }

    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  /**
   * Creates a MultiPolygon geometry from the given coordinates in the GeoJSON format.
   *
   * @param coordsNode The JsonNode containing the coordinates of the polygon(s) in GeoJSON format.
   * @return A MultiPolygon object representing the geometry of the county or municipality.
   */
  private MultiPolygon createMultiPolygon(JsonNode coordsNode) {
    List<Polygon> polygons = new ArrayList<>();

    for (JsonNode polygonNode : coordsNode) {
      for (JsonNode ringNode : polygonNode) {

        Coordinate[] coordinates = new Coordinate[ringNode.size()];

        for (int i = 0; i < ringNode.size(); i++) {
          JsonNode point = ringNode.get(i);

          double lng = point.get(0).asDouble();
          double lat = point.get(1).asDouble();

          coordinates[i] = new Coordinate(lng, lat);
        }

        LinearRing shell = geometryFactory.createLinearRing(coordinates);
        Polygon polygon = geometryFactory.createPolygon(shell);

        polygons.add(polygon);
      }
    }

    return geometryFactory.createMultiPolygon(polygons.toArray(new Polygon[0]));
  }

  /* private String cleanName(String name) {
    if (name == null) return null;
    return name.split(" - ")[0];
  } */

  /**
   * Finds the county that contains the given latitude and longitude coordinates.
   *
   * @param lat The latitude of the point to search for.
   * @param lng The longitude of the point to search for.
   * @return The name of the county that contains the point, or null if no county is found.
   */
  public String findCounty(double lat, double lng) {
    Point point = geometryFactory.createPoint(new Coordinate(lng, lat));
    for (CountyPolygon county : counties) {
      if (county.getGeometry().contains(point)) {
        return county.getName();
      }
    }
    return null;
  }

  /**
   * Finds the municipality that contains the given latitude and longitude coordinates.
   *
   * @param lat The latitude of the point to search for.
   * @param lng The longitude of the point to search for.
   * @return The name of the municipality that contains the point, or null if no municipality is
   *     found.
   */
  public String findMunicipality(double lat, double lng) {
    Point point = geometryFactory.createPoint(new Coordinate(lng, lat));
    for (municipalityPolygon municipality : municipalities) {
      if (municipality.getGeometry().contains(point)) {
        return municipality.getName();
      }
    }
    return null;
  }

  public static void main(String[] args) {
    GeoService service = new GeoService();
    service.loadCounties();
    service.loadMunicipalities();

    // Test with a known coordinate
    double testLat = 63.430448;
    double testLng = 10.395212;
    String county = service.findCounty(testLat, testLng);
    System.out.println("County for (" + testLat + ", " + testLng + "): " + county);
    String municipality = service.findMunicipality(testLat, testLng);
    System.out.println("Municipality for (" + testLat + ", " + testLng + "): " + municipality);
  }
}
