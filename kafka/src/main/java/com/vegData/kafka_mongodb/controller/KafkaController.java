package com.vegData.kafka_mongodb.controller;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.vegData.kafka_mongodb.collection.RawDataPole;
import com.vegData.kafka_mongodb.service.KafkaProducerService;

import org.springframework.http.MediaType;

@RestController
@RequestMapping("/kafka")
public class KafkaController {

    @Autowired
    private KafkaProducerService kafkaProducerService;

    @PostMapping("/send")
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

}
