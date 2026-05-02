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

import jakarta.annotation.PostConstruct;

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

  @Value("${kafka.collection.name}")
private String collectionName;

  @Autowired private PolesRepository polesRepository;
  @Autowired private GeoService geoService;
  @Autowired private NvdbService nvdbService;
  @Autowired private BatchNotificationCollector batchCollector;
 @Autowired private BatchNotificationService notificationService;

  private final String imgDir = "/var/www/RoadPolesImages/2026/";

  private static final Logger LOGGER = LoggerFactory.getLogger(KafkaConsumer.class);



  /**
   * Initialize batch notification settings after the bean is constructed. 
   * Configures the batch collector to trigger a notification when at least 3 poles are collected or after a 50 second timeout,
   */

  //TODO: this needs to be optimized. 
  @PostConstruct
 private void initializeBatchNotifications() {
    batchCollector.configure(3, 50000);
    batchCollector.setOnBatchReady(batch -> {
    LOGGER.info("Batch ready with {} poles", batch.size());
    notificationService.createBatchCaptureNotification(batch);
 });
 }
  

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
      groupId = "${spring.kafka.consumer.group-id}"
      
      )
  public void consume(RawDataPole data) {

    try {
      LOGGER.info(">>> CONSUMED DATA FROM KAFKA: {}", data);
      MongoCollection<Pole> collection = database.getCollection(collectionName, Pole.class);
      GeoJsonPoint location =
          new GeoJsonPoint(data.getNmeaInfo().getLongitude(), data.getNmeaInfo().getLatitude());
      Pole nearestPole = polesRepository.findNearestPole(location.getX(), location.getY());
      double lat = data.getNmeaInfo().getLatitude();
      double lng = data.getNmeaInfo().getLongitude();

      String county = geoService.findCounty(lat, lng);
      String municipality = geoService.findMunicipality(lat, lng);
      NvdbService.VeiSystem veiInfo = nvdbService.getVeiInfo(lat, lng);
      if (nearestPole != null && data.getImageBytes() != null && !data.getImageBytes().isEmpty()) {
        String imageId = UUID.randomUUID().toString();
        Long capturedDate = data.getCapturedDate();
        nearestPole.getImages().add(new ImageInfo(imageId, capturedDate, null, "not inspected", " ", " ", " "));
        Pole savedPole = polesRepository.save(nearestPole);
        Path filePath = Paths.get(imgDir + imageId + ".jpg");
        Files.createDirectories(filePath.getParent());
        Files.write(filePath, data.getImageBytes().get(0));
        batchCollector.addPole(savedPole);

      } else {
        Pole pole = new Pole();
        pole.setAltitude(data.getNmeaInfo().getAltitude());
        pole.setSpeed((int) data.getNmeaInfo().getSpeedOverGround());
        pole.setFixType(data.getNmeaInfo().getFixType());
        pole.setCourseOverGround(data.getNmeaInfo().getCourseOverGround());
        pole.setHdop(data.getNmeaInfo().getHdop());
        pole.setCapturedDate(data.getCapturedDate());
        pole.setLocation(location);
        pole.setCounty(county);
        pole.setMunicipality(municipality);
        applyVeiInfo(pole, veiInfo);
        pole.setFieldOfView(data.getCameraInfo().getFieldOfView());
        pole.setSatellitesUsed(data.getNmeaInfo().getSatellitesUsed());
        if (data.getImageBytes() != null && !data.getImageBytes().isEmpty()) {
          String imageId = UUID.randomUUID().toString();
          pole.getImages().add(new ImageInfo(imageId, data.getCapturedDate(), null, "not inspected", " ", " ", " "));
          Path filePath = Paths.get(imgDir + imageId + ".jpg");
          Files.createDirectories(filePath.getParent());
          Files.write(filePath, data.getImageBytes().get(0));
        }
       InsertOneResult result = collection.insertOne(pole);
        batchCollector.addPole(pole);
        
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

  private void applyVeiInfo(Pole pole, NvdbService.VeiSystem veiInfo) {
    if (pole == null || veiInfo == null) {
      return;
    }

    pole.setVegkategori(veiInfo.vegkategori());
    pole.setNummer(veiInfo.nummer());
    pole.setAvstand(veiInfo.avstand());
  }
}
