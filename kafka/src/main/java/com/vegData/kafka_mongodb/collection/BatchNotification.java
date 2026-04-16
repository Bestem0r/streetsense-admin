package com.vegData.kafka_mongodb.collection;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "notifications")
@JsonInclude(JsonInclude.Include.NON_NULL)
@AllArgsConstructor
@NoArgsConstructor
public class BatchNotification {
  @Id private String id;
  private String type; 
  private String severity; // "info", "warning", "critical"
  private int polesCount;
  private Long createdDate;
  private boolean read = false;
  private String[] poleIds;
}

