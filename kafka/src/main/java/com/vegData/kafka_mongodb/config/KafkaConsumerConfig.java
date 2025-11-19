package com.vegData.kafka_mongodb.config;

import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import com.fasterxml.jackson.databind.ser.std.ByteArraySerializer;
import com.vegData.kafka_mongodb.collection.RawDataPole;

@EnableKafka
@Configuration
public class KafkaConsumerConfig {

    @Value(value="${spring.kafka.consumer.bootstrap-servers}")
    private String bootstrapAddress;

    @Value(value="${spring.kafka.consumer.group-id}")
    private String groupId;

    @Bean
    public ConsumerFactory<String, RawDataPole> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG,bootstrapAddress);
        props.put(ConsumerConfig.GROUP_ID_CONFIG,groupId);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ErrorHandlingDeserializer.VALUE_DESERIALIZER_CLASS,JsonDeserializer.class.getName());
        props.put(JsonDeserializer.TRUSTED_PACKAGES, "*");
        return new DefaultKafkaConsumerFactory<>(props ,new StringDeserializer(), new JsonDeserializer<>(RawDataPole.class));
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, RawDataPole>
    kafkaListenerContainerFactory() {

        ConcurrentKafkaListenerContainerFactory<String, RawDataPole> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        return factory;
    }

    @Bean
    public ConsumerFactory<String, byte[]> consumerImageFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG,bootstrapAddress);
        props.put(ConsumerConfig.GROUP_ID_CONFIG,groupId);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ErrorHandlingDeserializer.VALUE_DESERIALIZER_CLASS,ByteArraySerializer.class.getName());
        return new DefaultKafkaConsumerFactory<>(props ,new StringDeserializer(), new org.apache.kafka.common.serialization.ByteArrayDeserializer());
    }


    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, byte[]> kafkaListenerContainerFactoryImage() {

        ConcurrentKafkaListenerContainerFactory<String, byte[]> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerImageFactory());
        return factory;
    }
}
