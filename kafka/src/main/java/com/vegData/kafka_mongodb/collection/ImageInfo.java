package com.vegData.kafka_mongodb.collection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImageInfo {
  private String imageId;
  private Long capturedDate;
}
