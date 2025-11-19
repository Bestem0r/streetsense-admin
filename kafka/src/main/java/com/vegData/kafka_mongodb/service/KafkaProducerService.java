package com.vegData.kafka_mongodb.service;

import org.apache.kafka.clients.producer.ProducerRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.vegData.kafka_mongodb.collection.RawDataPole;

@Service
@PropertySource(value = "classpath:application.properties")
public class KafkaProducerService {

    @Value(value = "${spring.kafka.topic.name}")
    private String topicName;

    private final KafkaTemplate<String, RawDataPole> kafkaTemplate;
    private final KafkaTemplate<String, byte[]> imageKafkaTemplate;

    public KafkaProducerService(KafkaTemplate<String, RawDataPole> kafkaTemplate,
            KafkaTemplate<String, byte[]> imageKafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        this.imageKafkaTemplate = imageKafkaTemplate;
    }

    public void sendMessage(String key, RawDataPole msg) {
        ProducerRecord<String, RawDataPole> record = new ProducerRecord<>(topicName, key, msg);
        kafkaTemplate.send(record);
    }

    public void sendImage(byte[] imageBytes, String fileName) {
        imageKafkaTemplate.send("pole-images", fileName, imageBytes);
    }
}
