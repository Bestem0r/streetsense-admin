package com.vegData.kafka_mongodb.service;

import static com.mongodb.MongoClientSettings.getDefaultCodecRegistry;
import static org.bson.codecs.configuration.CodecRegistries.fromProviders;
import static org.bson.codecs.configuration.CodecRegistries.fromRegistries;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.result.InsertOneResult;
import com.vegData.kafka_mongodb.collection.ImageInfo;
import com.vegData.kafka_mongodb.collection.Pole;
import com.vegData.kafka_mongodb.collection.RawDataPole;
import com.vegData.kafka_mongodb.repository.PolesRepository;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.bson.codecs.configuration.CodecProvider;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.codecs.pojo.PojoCodecProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

@Component
@Service
@Slf4j
@EnableAsync
@PropertySource(value = "classpath:application.properties")
public class KafkaConsumer {

  private final MongoClient mongoClient;

  private MongoDatabase database;

  @Value("kafkaMsg")
  private String collectionName;

  @Autowired private PolesRepository polesRepository;

  private final String imgDir = "/var/www/RoadPolesImages/2026/";

  private static final Logger LOGGER = LoggerFactory.getLogger(KafkaConsumer.class);

  KafkaConsumer(
      MongoClient mongoClient, @Value("${spring.data.mongodb.database}") String databaseName) {
    CodecProvider pojoCodecProvider = PojoCodecProvider.builder().automatic(true).build();

    CodecRegistry pojoCodecRegistry =
        fromRegistries(getDefaultCodecRegistry(), fromProviders(pojoCodecProvider));
    this.mongoClient = mongoClient;

    this.database = this.mongoClient.getDatabase(databaseName).withCodecRegistry(pojoCodecRegistry);
  }

  @KafkaListener(
      topics = "${spring.kafka.topic.name}",
      groupId = "${spring.kafka.consumer.group-id}",
      containerFactory = "kafkaListenerContainerFactory")
  public void consume(RawDataPole data) {

    try {
      System.out.println(">>> CONSUMED DATA FROM KAFKA: " + data.toString());
      MongoCollection<Pole> collection = database.getCollection(collectionName, Pole.class);
      GeoJsonPoint location =
          new GeoJsonPoint(data.getNmeaInfo().getLongitude(), data.getNmeaInfo().getLatitude());
      Pole nearestPole = polesRepository.findNearestPole(location.getX(), location.getY());

      if (nearestPole != null && data.getImageBytes() != null && !data.getImageBytes().isEmpty()) {
        String imageId = UUID.randomUUID().toString();
        String capturedDate = data.getCapturedDate();
        nearestPole.getImages().add(new ImageInfo(imageId, capturedDate));
        polesRepository.save(nearestPole);
        Path filePath = Paths.get(imgDir + imageId + ".jpg");
        Files.createDirectories(filePath.getParent());
        Files.write(filePath, data.getImageBytes().get(0));

      } else {
        System.out.println("test");
        Pole pole = new Pole();

        pole.setAltitude(data.getNmeaInfo().getAltitude());
        pole.setSpeed((int) data.getNmeaInfo().getSpeedOverGround());
        pole.setFixType(data.getNmeaInfo().getFixType());
        pole.setCourseOverGround(data.getNmeaInfo().getCourseOverGround());
        pole.setHdop(data.getNmeaInfo().getHdop());
        pole.setCapturedDate(data.getCapturedDate());
        pole.setLocation(location);
        pole.setFieldOfView(data.getCameraInfo().getFieldOfView());
        pole.setSatellitesUsed(data.getNmeaInfo().getSatellitesUsed());
        if (data.getImageBytes() != null && !data.getImageBytes().isEmpty()) {
          String imageId = UUID.randomUUID().toString();
          pole.getImages().add(new ImageInfo(imageId, data.getCapturedDate()));
          Path filePath = Paths.get(imgDir + imageId + ".jpg");
          Files.createDirectories(filePath.getParent());
          Files.write(filePath, data.getImageBytes().get(0));
        }
        InsertOneResult result = collection.insertOne(pole);
        String poleId = result.getInsertedId().asObjectId().getValue().toHexString();
        // return the newly created pole with the generated poleId from MongoDB
        Pole newPole = polesRepository.findById(poleId).orElse(null);

        System.out.println(">>> result: " + newPole.toString());

        if (result.wasAcknowledged()) {
          LOGGER.info("*** kafka Message saved **** ");
        } else {
          LOGGER.warn("*** Unable to save message from kafka **** ");
        }
      }

    } catch (Exception e) {
      LOGGER.error("Error while consuming message", e);
    }
  }

  /* @KafkaListener(topics = "pole-images", groupId = "${spring.kafka.consumer.group-id}", containerFactory = "kafkaListenerContainerFactoryImage")
  public void ConsumeImage(byte[] image, @Header(KafkaHeaders.RECEIVED_KEY) String fileName) {
      try {
          Path filePath = Paths.get(imgDir + fileName);
          LOGGER.info("Image file path: " + filePath.toString());
          // Create the directory if it doesn't exist
          Files.createDirectories(filePath.getParent());
          Files.write(filePath, image);
          LOGGER.info("Image saved to: " + filePath.toString());
      } catch (Exception e) {
          LOGGER.error("Error while consuming image", e);
      }
  } */
}
