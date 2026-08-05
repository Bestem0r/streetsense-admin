package com.vegobject.springboot_mongodb.service;

import com.mongodb.client.AggregateIterable;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.vegobject.springboot_mongodb.collection.CapturedDates;
import com.vegobject.springboot_mongodb.collection.ImageInfo;
import com.vegobject.springboot_mongodb.collection.Pole;
import com.vegobject.springboot_mongodb.dto.DashboardStatsResponse;
import com.vegobject.springboot_mongodb.dto.InspectorStatsResponse;
import com.vegobject.springboot_mongodb.dto.PagedPolesResponse;
import com.vegobject.springboot_mongodb.dto.PoleSummaryResponse;
import com.vegobject.springboot_mongodb.repository.PolesRepository;
import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;

import static org.mockito.Mockito.mockStatic;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PolesServiceImplTest {

    @Mock private PolesRepository polesRepository;
    @Mock private MongoTemplate mongoTemplate;
    @InjectMocks private PolesServiceImpl polesService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(polesService, "mongoUri", "mongodb://fake:27017/test");
    }

    private Pole pole(String id) {
        Pole p = new Pole();
        p.setId(id);
        p.setCounty("Oslo");
        p.setMunicipality("Sentrum");
        return p;
    }

    private AggregationResults<Document> aggResults(List<Document> docs) {
        return new AggregationResults<>(docs, new Document());
    }

    // ── getPoles ──────────────────────────────────────────────────────────────

    @Test
    void getPoles_returnsArrayFromRepo() {
        when(polesRepository.findAll()).thenReturn(List.of(pole("p1"), pole("p2")));
        assertEquals(2, polesService.getPoles().length);
    }

    @Test
    void getPoles_emptyRepo_returnsEmptyArray() {
        when(polesRepository.findAll()).thenReturn(List.of());
        assertEquals(0, polesService.getPoles().length);
    }

    // ── getPolesByInspector ───────────────────────────────────────────────────

    @Test
    void getPolesByInspector_delegatesRepository() {
        when(polesRepository.findByAssignedInspector("insp1")).thenReturn(List.of(pole("p1")));
        List<Pole> result = polesService.getPolesByInspector("insp1");
        assertEquals(1, result.size());
        assertEquals("p1", result.get(0).getId());
    }

    // ── getPolesByDate ────────────────────────────────────────────────────────

    @Test
    void getPolesByDate_noFilters_returnsPagedResponse() {
        when(mongoTemplate.count(any(Query.class), eq(Pole.class))).thenReturn(25L);
        when(mongoTemplate.find(any(Query.class), eq(Pole.class))).thenReturn(List.of(pole("p1")));

        PagedPolesResponse response = polesService.getPolesByDate("2024-01-15", 0, 10, null, null);

        assertEquals(0, response.page());
        assertEquals(10, response.size());
        assertEquals(25L, response.totalElements());
        assertTrue(response.hasMore());
        assertEquals(1, response.content().size());
    }

    @Test
    void getPolesByDate_lastPage_hasMoreFalse() {
        when(mongoTemplate.count(any(Query.class), eq(Pole.class))).thenReturn(5L);
        when(mongoTemplate.find(any(Query.class), eq(Pole.class))).thenReturn(List.of(pole("p1")));

        PagedPolesResponse response = polesService.getPolesByDate("2024-01-15", 0, 10, null, null);

        assertFalse(response.hasMore());
    }

    @Test
    void getPolesByDate_secondPage_hasMoreCalculatedCorrectly() {
        when(mongoTemplate.count(any(Query.class), eq(Pole.class))).thenReturn(15L);
        when(mongoTemplate.find(any(Query.class), eq(Pole.class))).thenReturn(List.of(pole("p1")));

        PagedPolesResponse response = polesService.getPolesByDate("2024-01-15", 1, 10, null, null);

        assertFalse(response.hasMore());
    }

    @Test
    void getPolesByDate_withCountyFilter_queriesRepository() {
        when(mongoTemplate.count(any(Query.class), eq(Pole.class))).thenReturn(3L);
        when(mongoTemplate.find(any(Query.class), eq(Pole.class))).thenReturn(List.of(pole("p1")));

        PagedPolesResponse response = polesService.getPolesByDate("2024-01-15", 0, 10, "Oslo", null);

        assertNotNull(response);
        assertEquals(3L, response.totalElements());
    }

    // ── getSummary ────────────────────────────────────────────────────────────

    @Test
    void getSummary_noFilters_returnsSummaryWithDatesAndCounties() {
        Document dateDoc = new Document("capturedDate", 1705276800000L).append("count", 3);
        Document countyDoc = new Document("county", "Oslo")
                .append("municipalities", List.of("Sentrum", "Alna"));

        when(mongoTemplate.aggregate(any(Aggregation.class), eq("kafkaMsg"), eq(Document.class)))
                .thenReturn(aggResults(List.of(dateDoc)))
                .thenReturn(aggResults(List.of(countyDoc)));

        PoleSummaryResponse response = polesService.getSummary(null, null);

        assertNotNull(response);
        assertEquals(1, response.dates().size());
        assertEquals(3, response.dates().get(0).count());
        assertEquals(1705276800000L, response.dates().get(0).capturedDate());
        assertEquals(1, response.countyData().size());
        assertEquals("Oslo", response.countyData().get(0).county());
        assertEquals(2, response.countyData().get(0).municipalities().size());
    }

    @Test
    void getSummary_emptyResults_returnsEmptyLists() {
        when(mongoTemplate.aggregate(any(Aggregation.class), eq("kafkaMsg"), eq(Document.class)))
                .thenReturn(aggResults(List.of()))
                .thenReturn(aggResults(List.of()));

        PoleSummaryResponse response = polesService.getSummary(null, null);

        assertTrue(response.dates().isEmpty());
        assertTrue(response.countyData().isEmpty());
        assertTrue(response.availableCounties().isEmpty());
        assertTrue(response.availableMunicipalities().isEmpty());
    }

    @Test
    void getSummary_availableCountiesExtractedFromCountyData() {
        Document countyDoc = new Document("county", "Bergen")
                .append("municipalities", List.of("Bergenhus"));

        when(mongoTemplate.aggregate(any(Aggregation.class), eq("kafkaMsg"), eq(Document.class)))
                .thenReturn(aggResults(List.of()))
                .thenReturn(aggResults(List.of(countyDoc)));

        PoleSummaryResponse response = polesService.getSummary(null, null);

        assertTrue(response.availableCounties().contains("Bergen"));
        assertTrue(response.availableMunicipalities().contains("Bergenhus"));
    }

    // ── deletePoleById ────────────────────────────────────────────────────────

    @Test
    void deletePoleById_success_delegatesRepository() {
        assertDoesNotThrow(() -> polesService.deletePoleById("p1"));
        verify(polesRepository).deleteById("p1");
    }

    @Test
    void deletePoleById_repositoryThrows_wrapsException() {
        doThrow(new RuntimeException("DB error")).when(polesRepository).deleteById("p1");
        RuntimeException ex = assertThrows(RuntimeException.class, () -> polesService.deletePoleById("p1"));
        assertTrue(ex.getMessage().contains("p1"));
    }

    // ── getPoleById ───────────────────────────────────────────────────────────

    @Test
    void getPoleById_found_returnsPole() {
        when(polesRepository.findById("p1")).thenReturn(Optional.of(pole("p1")));
        assertEquals("p1", polesService.getPoleById("p1").getId());
    }

    @Test
    void getPoleById_notFound_throwsRuntimeException() {
        when(polesRepository.findById("x")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> polesService.getPoleById("x"));
    }

    // ── updatePole ────────────────────────────────────────────────────────────

    @Test
    void updatePole_setsIdAndLastModifiedThenSaves() {
        Pole update = pole(null);
        when(polesRepository.save(update)).thenReturn(update);

        polesService.updatePole("p1", update);

        assertEquals("p1", update.getId());
        assertNotNull(update.getLastModified());
        verify(polesRepository).save(update);
    }

    // ── getCapturedDateStrings ─────────────────────────────────────────────────

    @Test
    void getCapturedDateStrings_delegatesRepository() {
        CapturedDates dates = CapturedDates.builder().build();
        when(polesRepository.findAllCapturedDate()).thenReturn(dates);
        assertSame(dates, polesService.getCapturedDateStrings());
    }

    // ── getPolesByDate — municipalities branch ────────────────────────────────

    @Test
    void getPolesByDate_withMunicipalityFilter_queriesRepository() {
        when(mongoTemplate.count(any(Query.class), eq(Pole.class))).thenReturn(1L);
        when(mongoTemplate.find(any(Query.class), eq(Pole.class))).thenReturn(List.of(pole("p1")));
        PagedPolesResponse response = polesService.getPolesByDate("2024-01-15", 0, 10, null, "Sentrum");
        assertEquals(1L, response.totalElements());
    }

    // ── getSummary — filter branches ──────────────────────────────────────────

    @Test
    void getSummary_withCountyFilter_returnsResults() {
        Document dateDoc = new Document("capturedDate", 1705276800000L).append("count", 2);
        when(mongoTemplate.aggregate(any(Aggregation.class), eq("kafkaMsg"), eq(Document.class)))
                .thenReturn(aggResults(List.of(dateDoc)))
                .thenReturn(aggResults(List.of()));
        PoleSummaryResponse response = polesService.getSummary("Oslo", null);
        assertNotNull(response);
        assertEquals(1, response.dates().size());
    }

    @Test
    void getSummary_withMunicipalityFilter_returnsResults() {
        when(mongoTemplate.aggregate(any(Aggregation.class), eq("kafkaMsg"), eq(Document.class)))
                .thenReturn(aggResults(List.of()))
                .thenReturn(aggResults(List.of()));
        assertNotNull(polesService.getSummary(null, "Sentrum"));
    }

    @Test
    void getSummary_withBothFilters_returnsResults() {
        when(mongoTemplate.aggregate(any(Aggregation.class), eq("kafkaMsg"), eq(Document.class)))
                .thenReturn(aggResults(List.of()))
                .thenReturn(aggResults(List.of()));
        assertNotNull(polesService.getSummary("Oslo", "Sentrum"));
    }

    // ── checkConsecutivePoles branches ────────────────────────────────────────

    @Test
    void updatePole_nullLocation_skipsConsecutiveCheck() {
        Pole update = pole("p1");
        update.setLocation(null);
        ImageInfo img = new ImageInfo();
        img.setAction("Replace");
        img.setCapturedDate(1705276800000L);
        update.setImages(List.of(img));
        when(polesRepository.save(update)).thenReturn(update);

        polesService.updatePole("p1", update);

        verify(mongoTemplate, never()).find(any(Query.class), eq(Pole.class));
    }

    @Test
    void updatePole_nullImages_skipsConsecutiveCheck() {
        Pole update = pole("p1");
        update.setLocation(new GeoJsonPoint(10.7, 59.9));
        update.setImages(null);
        when(polesRepository.save(update)).thenReturn(update);

        polesService.updatePole("p1", update);

        verify(mongoTemplate, never()).find(any(Query.class), eq(Pole.class));
    }

    @Test
    void updatePole_noReplaceImages_skipsConsecutiveCheck() {
        Pole update = pole("p1");
        update.setLocation(new GeoJsonPoint(10.7, 59.9));
        ImageInfo img = new ImageInfo();
        img.setAction("Inspect");
        img.setCapturedDate(1705276800000L);
        update.setImages(List.of(img));
        when(polesRepository.save(update)).thenReturn(update);

        polesService.updatePole("p1", update);

        verify(mongoTemplate, never()).find(any(Query.class), eq(Pole.class));
    }

    @Test
    void updatePole_neighborDifferentRoad_noDueDateSet() {
        Pole mainPole = pole("p1");
        mainPole.setRoadCategory("E");
        mainPole.setRoadNumber(6);
        mainPole.setLocation(new GeoJsonPoint(10.7, 59.9));
        ImageInfo img = new ImageInfo();
        img.setCapturedDate(1705276800000L);
        img.setAction("Replace");
        mainPole.setImages(List.of(img));

        Pole neighbor = pole("p2");
        neighbor.setRoadCategory("F");
        neighbor.setRoadNumber(6);
        ImageInfo neighborImg = new ImageInfo();
        neighborImg.setCapturedDate(1705276800000L);
        neighborImg.setAction("Replace");
        neighbor.setImages(new ArrayList<>(List.of(neighborImg)));

        when(polesRepository.save(mainPole)).thenReturn(mainPole);
        when(mongoTemplate.find(any(Query.class), eq(Pole.class))).thenReturn(List.of(neighbor));

        polesService.updatePole("p1", mainPole);

        assertNull(neighborImg.getDueDate());
    }

    @Test
    void updatePole_neighborNullImages_skipsNeighbor() {
        Pole mainPole = pole("p1");
        mainPole.setRoadCategory("E");
        mainPole.setRoadNumber(6);
        mainPole.setLocation(new GeoJsonPoint(10.7, 59.9));
        ImageInfo img = new ImageInfo();
        img.setCapturedDate(1705276800000L);
        img.setAction("Replace");
        mainPole.setImages(List.of(img));

        Pole neighbor = pole("p2");
        neighbor.setRoadCategory("E");
        neighbor.setRoadNumber(6);
        neighbor.setImages(null);

        when(polesRepository.save(mainPole)).thenReturn(mainPole);
        when(mongoTemplate.find(any(Query.class), eq(Pole.class))).thenReturn(List.of(neighbor));

        polesService.updatePole("p1", mainPole);

        verify(polesRepository, times(1)).save(any(Pole.class));
    }

    @Test
    void updatePole_neighborNoMatchingDate_noDueDateSet() {
        Pole mainPole = pole("p1");
        mainPole.setRoadCategory("E");
        mainPole.setRoadNumber(6);
        mainPole.setLocation(new GeoJsonPoint(10.7, 59.9));
        ImageInfo img = new ImageInfo();
        img.setCapturedDate(1705276800000L);
        img.setAction("Replace");
        mainPole.setImages(List.of(img));

        Pole neighbor = pole("p2");
        neighbor.setRoadCategory("E");
        neighbor.setRoadNumber(6);
        ImageInfo neighborImg = new ImageInfo();
        neighborImg.setCapturedDate(1609459200000L); // different day
        neighborImg.setAction("Replace");
        neighbor.setImages(new ArrayList<>(List.of(neighborImg)));

        when(polesRepository.save(mainPole)).thenReturn(mainPole);
        when(mongoTemplate.find(any(Query.class), eq(Pole.class))).thenReturn(List.of(neighbor));

        polesService.updatePole("p1", mainPole);

        assertNull(neighborImg.getDueDate());
    }

    @Test
    void updatePole_withReplaceImageNeighbor_sameRoadSetsDueDate() {
        Pole mainPole = pole("p1");
        mainPole.setRoadCategory("E");
        mainPole.setRoadNumber(6);
        mainPole.setLocation(
                new org.springframework.data.mongodb.core.geo.GeoJsonPoint(10.7, 59.9));

        ImageInfo img = new ImageInfo();
        img.setCapturedDate(1705276800000L);
        img.setAction("Replace");
        mainPole.setImages(List.of(img));

        Pole neighbor = pole("p2");
        neighbor.setRoadCategory("E");
        neighbor.setRoadNumber(6);
        ImageInfo neighborImg = new ImageInfo();
        neighborImg.setCapturedDate(1705276800000L);
        neighborImg.setAction("Replace");
        neighbor.setImages(new java.util.ArrayList<>(List.of(neighborImg)));

        when(polesRepository.save(mainPole)).thenReturn(mainPole);
        when(mongoTemplate.find(any(Query.class), eq(Pole.class))).thenReturn(List.of(neighbor));

        polesService.updatePole("p1", mainPole);

        assertNotNull(neighborImg.getDueDate());
        verify(polesRepository).save(neighbor);
    }

    // ── getDashboardStats ─────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private MongoCollection<Document> mockMongoChain(MockedStatic<MongoClients> clients, AggregateIterable<Document> iterable) {
        MongoClient mockClient = mock(MongoClient.class);
        MongoDatabase mockDb = mock(MongoDatabase.class);
        MongoCollection<Document> mockCollection = mock(MongoCollection.class);
        clients.when(() -> MongoClients.create(anyString())).thenReturn(mockClient);
        when(mockClient.getDatabase("vegobject")).thenReturn(mockDb);
        when(mockDb.getCollection("kafkaMsg")).thenReturn(mockCollection);
        when(mockCollection.aggregate(any())).thenReturn(iterable);
        return mockCollection;
    }

    @Test
    void getDashboardStats_nullFacetResult_returnsZeros() {
        AggregateIterable<Document> iterable = mock(AggregateIterable.class);
        try (MockedStatic<MongoClients> clients = mockStatic(MongoClients.class)) {
            mockMongoChain(clients, iterable);
            when(iterable.first()).thenReturn(null);

            DashboardStatsResponse r = polesService.getDashboardStats();

            assertEquals(0, r.totalPoles());
            assertEquals(0, r.inspectedCount());
        }
    }

    @Test
    void getDashboardStats_validResult_parsesFacetDocument() {
        AggregateIterable<Document> iterable = mock(AggregateIterable.class);
        try (MockedStatic<MongoClients> clients = mockStatic(MongoClients.class)) {
            mockMongoChain(clients, iterable);

            Document facet = new Document()
                    .append("totalCount", List.of(new Document("count", 10)))
                    .append("inspectedCount", List.of(new Document("count", 6)))
                    .append("captureDates", List.of(new Document("capturedDate", 1705276800000L).append("count", 3)))
                    .append("byCounty", List.of(new Document("county", "Oslo").append("count", 5)))
                    .append("byInspector", List.of(new Document("_id", "insp1").append("inspected", 3).append("pending", 2)))
                    .append("recentInspections", List.of(
                            new Document("poleId", "p1").append("county", "Oslo").append("action", "Replace")
                                    .append("assignedInspector", "insp1").append("inspectionDate", 1705276800000L)));
            when(iterable.first()).thenReturn(facet);

            DashboardStatsResponse r = polesService.getDashboardStats();

            assertEquals(10, r.totalPoles());
            assertEquals(6, r.inspectedCount());
            assertEquals(1, r.captureDates().size());
            assertEquals("Oslo", r.byCounty().get(0).county());
        }
    }

    // ── getInspectorStats ─────────────────────────────────────────────────────

    @Test
    void getInspectorStats_nullFacetResult_returnsZeros() {
        AggregateIterable<Document> iterable = mock(AggregateIterable.class);
        try (MockedStatic<MongoClients> clients = mockStatic(MongoClients.class)) {
            mockMongoChain(clients, iterable);
            when(iterable.first()).thenReturn(null);

            InspectorStatsResponse r = polesService.getInspectorStats("insp1");

            assertEquals(0, r.totalAssigned());
            assertEquals(0, r.inspectedCount());
        }
    }

    @Test
    void getInspectorStats_validResult_parsesFacetDocument() {
        AggregateIterable<Document> iterable = mock(AggregateIterable.class);
        try (MockedStatic<MongoClients> clients = mockStatic(MongoClients.class)) {
            mockMongoChain(clients, iterable);

            Document facet = new Document()
                    .append("totalCount", List.of(new Document("count", 5)))
                    .append("inspectedCount", List.of(new Document("count", 3)))
                    .append("byAction", List.of(new Document("action", "Replace").append("count", 2)))
                    .append("byCounty", List.of(new Document("county", "Oslo").append("count", 4)))
                    .append("byMunicipality", List.of(new Document("municipality", "Sentrum").append("count", 2)))
                    .append("recentActivity", List.of(
                            new Document("poleId", "p1").append("county", "Oslo")
                                    .append("action", "Replace").append("inspectionDate", 1705276800000L)));
            when(iterable.first()).thenReturn(facet);

            InspectorStatsResponse r = polesService.getInspectorStats("insp1");

            assertEquals(5, r.totalAssigned());
            assertEquals(3, r.inspectedCount());
            assertEquals("Replace", r.byAction().get(0).action());
        }
    }

    // ── getPolesNear ──────────────────────────────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void getPolesNear_returnsMappedPoles() {
        AggregateIterable<Document> iterable = mock(AggregateIterable.class);
        try (MockedStatic<MongoClients> clients = mockStatic(MongoClients.class)) {
            mockMongoChain(clients, iterable);

            Document poleDoc = new Document()
                    .append("altitude", 100.0)
                    .append("speed", 5)
                    .append("fixType", 3)
                    .append("courseOverGround", 180.0)
                    .append("hdop", 1.2)
                    .append("capturedDate", 1705276800000L)
                    .append("loca", new Document("coordinates", List.of(10.7, 59.9)));

            doAnswer(inv -> {
                Consumer<Document> consumer = inv.getArgument(0);
                consumer.accept(poleDoc);
                return null;
            }).when(iterable).forEach(any(Consumer.class));

            Pole[] result = polesService.getPolesNear("2024-01-15", 10.7, 59.9);

            assertEquals(1, result.length);
            assertEquals(100.0, result[0].getAltitude());
            assertEquals(1705276800000L, result[0].getCapturedDate());
        }
    }
}
