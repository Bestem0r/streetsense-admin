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
      @RequestPart("payload") String payloadJson, @RequestPart("images") MultipartFile[] images)
      throws Exception {

    ObjectMapper mapper = new ObjectMapper();
    RawDataPole payload = mapper.readValue(payloadJson, RawDataPole.class);
    if (images != null) {
      for (MultipartFile image : images) {
        payload.getImageBytes().add(image.getBytes());
      }
    }

    kafkaProducerService.sendData(payload);
    System.out.println(">>> DATA RECEIVED FOR KAFKA: " + payload.toString());
    System.out.println(">>> NUMBER OF IMAGES: " + (images != null ? images.length : 0));
    return ResponseEntity.ok("Data and images sent to Kafka topic");
  }



}
