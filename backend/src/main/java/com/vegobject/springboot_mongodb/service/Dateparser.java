package com.vegobject.springboot_mongodb.service;
import java.time.*;
import java.time.format.DateTimeParseException;

public class Dateparser {

    public static Long toUnixSeconds(String input) {
        if (input == null || input.isBlank()) return null;

        input = input.trim();

        if (input.matches("^\\d+(\\.\\d+)?$")) {
            double seconds = Double.parseDouble(input);
            return (long) seconds;
        }

        try {
            Instant instant = Instant.parse(input);
            return instant.getEpochSecond();
        } catch (DateTimeParseException ignored) {}

        try {
            LocalDate date = LocalDate.parse(input);
            return date.atStartOfDay(ZoneOffset.UTC).toEpochSecond();
        } catch (DateTimeParseException ignored) {}
        return null;
    }
}
