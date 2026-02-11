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

  /* @PostMapping(value = "/send", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<String> sendSnowPoleData(
      @RequestPart("payload") String payloadJson,
      @RequestPart(value = "images", required = false) List<MultipartFile> images) {

      try {
          ObjectMapper mapper = new ObjectMapper();
          RawDataPole payload = mapper.readValue(payloadJson, RawDataPole.class);

          kafkaProducerService.sendMessage("poles", payload);

          if (images != null) {
              for (MultipartFile image : images) {
                  kafkaProducerService.sendImage(image.getBytes(), image.getOriginalFilename());
              }
          }

          return ResponseEntity.ok("Data and images sent to Kafka topic");
      } catch (Exception e) {
          return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                  .body("Invalid payload JSON: " + e.getMessage());
      }
  } */

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

    /* if (images != null) {
        for (MultipartFile image : images) {
            System.out.println(">>> IMAGE RECEIVED: " + image.getOriginalFilename());
            kafkaProducerService.sendImage(image.getBytes(), image.getOriginalFilename());
        }
    } */
    return ResponseEntity.ok("Data and images sent to Kafka topic");
  }

  /* @PostMapping("/send")
  public String sendMessage(@RequestBody RawDataPole poles) {
      kafkaProducerService.sendMessage("poles", poles);
      return "Message sent to Kafka topic";
  }

  @PostMapping(value = "/sendImg", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<String> uploadImg(@RequestParam("image") MultipartFile image) {
      if (image.isEmpty()) {
          return ResponseEntity.badRequest().body("File is empty");
      }
      try {
          String originalFileName = image.getOriginalFilename();
          if (originalFileName == null || originalFileName.isEmpty()) {
              return ResponseEntity.badRequest().body("File name is empty");
          }
          byte[] imageBytes = image.getBytes();
          kafkaProducerService.sendImage(imageBytes, originalFileName);

          return ResponseEntity.ok("Image sent to Kafka topic");
      } catch (IOException e) {
          return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error sending image to Kafka topic");
      }
  }
      */

}
