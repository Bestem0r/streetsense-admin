package com.vegobject.springboot_mongodb.collection;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Builder.Default;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@Document(collection = "Capture")
@JsonInclude(JsonInclude.Include.NON_NULL)

public class Capture {
  @Id private String id;
  @Default
  private List<String> poles = new ArrayList<>();
  private Long startDate;
  private Long endDate;
  private Long createdDate;

  
  
}
