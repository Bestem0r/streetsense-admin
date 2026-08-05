package com.vegData.kafka_mongodb.service;

import com.vegData.kafka_mongodb.collection.RawDataPole;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@PropertySource(value = "classpath:application.properties")
public class KafkaProducerService {

  @Value(value = "${spring.kafka.topic.name}")
  private String topicName;

  private final KafkaTemplate<String, RawDataPole> kafkaTemplate;

  // private final KafkaTemplate<String, byte[]> imageKafkaTemplate;

  public KafkaProducerService(
      KafkaTemplate<String, RawDataPole> kafkaTemplate,
      KafkaTemplate<String, byte[]> imageKafkaTemplate) {
    this.kafkaTemplate = kafkaTemplate;
    // this.imageKafkaTemplate = imageKafkaTemplate;
  }

  public void sendData(RawDataPole data) {
    kafkaTemplate.send(topicName, data);
  }
}
