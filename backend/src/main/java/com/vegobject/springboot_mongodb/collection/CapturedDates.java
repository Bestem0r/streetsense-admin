package com.vegobject.springboot_mongodb.collection;

import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Builder;
import lombok.Data;



@Data
@Builder
@Document(collection = "kafkaMsg")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CapturedDates {

    private String[] capturedDates;

}
