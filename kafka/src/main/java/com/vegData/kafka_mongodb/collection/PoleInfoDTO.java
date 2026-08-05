package com.vegData.kafka_mongodb.collection;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "kafkaMsg")
@JsonInclude(JsonInclude.Include.NON_NULL)
@AllArgsConstructor
@NoArgsConstructor
public class PoleInfoDTO {
  private double latitude;
  private double longitude;
  private double confidence;
  private String label;
  private double boundingBoxX;
  private double boundingBoxY;
  private double boundingBoxWidth;
  private double boundingBoxHeight;
  
}
