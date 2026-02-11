package com.vegobject.springboot_mongodb.collection;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@Document(collection = "kafkaMsg")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CapturedDates {

  private String[] capturedDates;
}
