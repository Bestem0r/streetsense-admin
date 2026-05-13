package com.vegobject.springboot_mongodb.collection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImageInfo {
  private String imageId;
  private Long capturedDate;
  private String inspectionStatus;
  private String action;
  private Long inspectionDate;
  private Long dueDate;
  private String notes;
}
