package com.vegobject.springboot_mongodb.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DateparserTest {

    @Test
    void toUnixSeconds_null_returnsNull() {
        assertNull(Dateparser.toUnixSeconds(null));
    }

    @Test
    void toUnixSeconds_emptyString_returnsNull() {
        assertNull(Dateparser.toUnixSeconds(""));
    }

    @Test
    void toUnixSeconds_blankString_returnsNull() {
        assertNull(Dateparser.toUnixSeconds("   "));
    }

    @Test
    void toUnixSeconds_numericInteger_returnsLong() {
        assertEquals(1700000000L, Dateparser.toUnixSeconds("1700000000"));
    }

    @Test
    void toUnixSeconds_numericWithDecimal_returnsLongFloor() {
        assertEquals(1700000000L, Dateparser.toUnixSeconds("1700000000.9"));
    }

    @Test
    void toUnixSeconds_isoInstant_returnsEpochSecond() {
        Long result = Dateparser.toUnixSeconds("2024-01-15T00:00:00Z");
        assertNotNull(result);
        assertEquals(1705276800L, result);
    }

    @Test
    void toUnixSeconds_localDate_returnsStartOfDayUtc() {
        Long result = Dateparser.toUnixSeconds("2024-01-15");
        assertNotNull(result);
        assertEquals(1705276800L, result);
    }

    @Test
    void toUnixSeconds_invalidString_returnsNull() {
        assertNull(Dateparser.toUnixSeconds("not-a-date"));
    }

    @Test
    void toUnixSeconds_partialDate_returnsNull() {
        assertNull(Dateparser.toUnixSeconds("2024-01"));
    }

    @Test
    void toUnixSeconds_whitespaceAround_treatedAsNumeric() {
        assertEquals(1700000000L, Dateparser.toUnixSeconds("  1700000000  "));
    }
}
