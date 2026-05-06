package com.vegobject.springboot_mongodb.dto;

import com.vegobject.springboot_mongodb.collection.Pole;
import java.util.List;


/**
 * class to represent a paginated response for poles.
 */
public record PagedPolesResponse(
    List<Pole> content,
    int page,
    int size,
    long totalElements,
    boolean hasMore) {}
