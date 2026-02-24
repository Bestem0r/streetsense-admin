package com.vegobject.springboot_mongodb.service;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class Dateparser {

    public static Long toUnixSeconds(String input) {
        if (input == null || input.isBlank()) return null;

        input = input.trim();

        // 1️⃣ Already unix timestamp (seconds or float)
        if (input.matches("^\\d+(\\.\\d+)?$")) {
            double seconds = Double.parseDouble(input);
            return (long) seconds;
        }

        // 2️⃣ ISO datetime: 2026-02-20T14:30:00Z
        try {
            Instant instant = Instant.parse(input);
            return instant.getEpochSecond();
        } catch (DateTimeParseException ignored) {}

        // 3️⃣ yyyy-MM-dd
        try {
            LocalDate date = LocalDate.parse(input);
            return date.atStartOfDay(ZoneOffset.UTC).toEpochSecond();
        } catch (DateTimeParseException ignored) {}
        return null;
    }
}
