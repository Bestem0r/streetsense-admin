package com.vegData.kafka_mongodb.service;

import java.util.List;

import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;

@Service
public class NvdbService {

  private final RestTemplate restTemplate = new RestTemplate();

 public VeiSystem getVeiInfo(double lat, double lon) {
  String url =
      String.format(
          "https://nvdbapiles.atlas.vegvesen.no/vegnett/api/v4/posisjon?lat=%s&lon=%s",
          lat, lon);

  try {
    HttpHeaders headers = new HttpHeaders();
    headers.set("X-Client", "vegdata-kafka-service"); // 🔥 REQUIRED

    HttpEntity<Void> entity = new HttpEntity<>(headers);

    ResponseEntity<NvdbPosition[]> response = restTemplate.exchange(
        url,
        HttpMethod.GET,
        entity,
        NvdbPosition[].class
    );

    NvdbPosition[] body = response.getBody();

    if (body == null || body.length == 0) {
      return null;
    }

    NvdbPosition position = body[0];
    if (position == null
        || position.vegsystemreferanse == null
        || position.vegsystemreferanse.vegsystem == null) {
      return null;
    }

    return new VeiSystem(
        position.vegsystemreferanse.vegsystem.vegkategori,
        position.vegsystemreferanse.vegsystem.nummer,
        position.avstand);

  } catch (RestClientException e) {
    return null;
  }
}

  public record VeiSystem(String vegkategori, Integer nummer, Double avstand) {}

  private record NvdbPosition(Vegsystemreferanse vegsystemreferanse, Double avstand) {}

  private record Vegsystemreferanse(Vegsystem vegsystem) {}

  private record Vegsystem(String vegkategori, Integer nummer) {}
}