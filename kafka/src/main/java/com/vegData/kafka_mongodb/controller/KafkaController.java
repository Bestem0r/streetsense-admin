package com.vegData.kafka_mongodb.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vegData.kafka_mongodb.collection.RawDataPole;
import com.vegData.kafka_mongodb.service.KafkaProducerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/kafka")
public class KafkaController {

  @Autowired private KafkaProducerService kafkaProducerService;

  

  @PostMapping(value = "/send", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<String> sendSnowPoleData(
      @RequestPart("payload") String payloadJson,
      @RequestPart(value = "images", required = false) MultipartFile image)
      throws Exception {

    ObjectMapper mapper = new ObjectMapper();
    RawDataPole payload = mapper.readValue(payloadJson, RawDataPole.class);

    if (image != null && !image.isEmpty()) {
      payload.setImageBytes(image.getBytes());
    }

    kafkaProducerService.sendData(payload);
    return ResponseEntity.ok("Data and images sent to Kafka topic");
  }



}
