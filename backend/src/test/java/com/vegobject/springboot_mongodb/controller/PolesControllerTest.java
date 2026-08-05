package com.vegobject.springboot_mongodb.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vegobject.springboot_mongodb.collection.CapturedDates;
import com.vegobject.springboot_mongodb.collection.LocationRequest;
import com.vegobject.springboot_mongodb.collection.Pole;
import com.vegobject.springboot_mongodb.config.SecurityConfig;
import com.vegobject.springboot_mongodb.dto.*;
import com.vegobject.springboot_mongodb.security.CustomUserDetailsService;
import com.vegobject.springboot_mongodb.security.JwtTokenProvider;
import com.vegobject.springboot_mongodb.service.PolesService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PolesController.class)
@Import(SecurityConfig.class)
class PolesControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private PolesService polesService;
    @MockitoBean private JwtTokenProvider jwtTokenProvider;
    @MockitoBean private CustomUserDetailsService customUserDetailsService;

    private Pole pole(String id) {
        Pole p = new Pole();
        p.setId(id);
        p.setCounty("Oslo");
        return p;
    }

    // ── GET /poles ────────────────────────────────────────────────────────────

    @Test
    void getPoles_returns200WithArray() throws Exception {
        when(polesService.getPoles()).thenReturn(new Pole[]{pole("p1"), pole("p2")});

        mockMvc.perform(get("/poles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value("p1"));
    }

    @Test
    void getPoles_emptyRepo_returns200WithEmptyArray() throws Exception {
        when(polesService.getPoles()).thenReturn(new Pole[0]);

        mockMvc.perform(get("/poles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ── GET /poles/date ───────────────────────────────────────────────────────

    @Test
    void getPolesByDate_withRequiredParam_returns200() throws Exception {
        PagedPolesResponse paged = new PagedPolesResponse(List.of(pole("p1")), 0, 10, 1L, false);
        when(polesService.getPolesByDate(eq("2024-01-15"), eq(0), eq(10), isNull(), isNull()))
                .thenReturn(paged);

        mockMvc.perform(get("/poles/date")
                        .param("date", "2024-01-15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void getPolesByDate_withCountyFilter_passesFilterToService() throws Exception {
        PagedPolesResponse paged = new PagedPolesResponse(List.of(pole("p1")), 0, 10, 1L, false);
        when(polesService.getPolesByDate(eq("2024-01-15"), eq(0), eq(10), eq("Oslo"), isNull()))
                .thenReturn(paged);

        mockMvc.perform(get("/poles/date")
                        .param("date", "2024-01-15")
                        .param("counties", "Oslo"))
                .andExpect(status().isOk());
    }

    // ── GET /poles/summary ────────────────────────────────────────────────────

    @Test
    void getSummary_noFilters_returns200() throws Exception {
        PoleSummaryResponse summary = new PoleSummaryResponse(List.of(), List.of(), List.of(), List.of());
        when(polesService.getSummary(isNull(), isNull())).thenReturn(summary);

        mockMvc.perform(get("/poles/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dates").isArray());
    }

    @Test
    void getSummary_withFilters_passesFiltersToService() throws Exception {
        PoleSummaryResponse summary = new PoleSummaryResponse(List.of(), List.of(), List.of(), List.of());
        when(polesService.getSummary(eq("Oslo"), eq("Sentrum"))).thenReturn(summary);

        mockMvc.perform(get("/poles/summary")
                        .param("counties", "Oslo")
                        .param("municipalities", "Sentrum"))
                .andExpect(status().isOk());
    }

    // ── GET /poles/capturedDates ──────────────────────────────────────────────

    @Test
    void getCapturedDateStrings_returns200() throws Exception {
        when(polesService.getCapturedDateStrings()).thenReturn(CapturedDates.builder().build());

        mockMvc.perform(get("/poles/capturedDates"))
                .andExpect(status().isOk());
    }

    // ── POST /poles/near ──────────────────────────────────────────────────────

    @Test
    void getPolesNear_validRequest_returns200WithPoles() throws Exception {
        when(polesService.getPolesNear(anyString(), anyDouble(), anyDouble()))
                .thenReturn(new Pole[]{pole("p1")});

        LocationRequest req = new LocationRequest();
        req.setCapturedDate("2024-01-15");
        req.setLatitude(59.9);
        req.setLongitude(10.7);

        mockMvc.perform(post("/poles/near")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void getPolesNear_zeroCoordinates_returnsEmptyArray() throws Exception {
        LocationRequest req = new LocationRequest();
        req.setCapturedDate("2024-01-15");
        req.setLatitude(0.0);
        req.setLongitude(0.0);

        mockMvc.perform(post("/poles/near")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getPolesNear_nullCapturedDate_returnsEmptyArray() throws Exception {
        LocationRequest req = new LocationRequest();
        req.setLatitude(59.9);
        req.setLongitude(10.7);

        mockMvc.perform(post("/poles/near")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getPolesNear_invalidDateFormat_returnsEmptyArray() throws Exception {
        LocationRequest req = new LocationRequest();
        req.setCapturedDate("01/15/2024");
        req.setLatitude(59.9);
        req.setLongitude(10.7);

        mockMvc.perform(post("/poles/near")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ── DELETE /poles/{id} ────────────────────────────────────────────────────

    @Test
    void deletePoleById_returns200() throws Exception {
        doNothing().when(polesService).deletePoleById("p1");

        mockMvc.perform(delete("/poles/p1"))
                .andExpect(status().isOk());
    }

    // ── GET /poles/id/{id} ────────────────────────────────────────────────────

    @Test
    void getPoleById_returns200WithPole() throws Exception {
        when(polesService.getPoleById("p1")).thenReturn(pole("p1"));

        mockMvc.perform(get("/poles/id/p1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("p1"));
    }

    // ── GET /poles/inspector/{inspectorId} ────────────────────────────────────

    @Test
    void getPolesByInspector_returns200() throws Exception {
        when(polesService.getPolesByInspector("insp1")).thenReturn(List.of(pole("p1")));

        mockMvc.perform(get("/poles/inspector/insp1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    // ── GET /poles/inspector/{inspectorId}/stats ──────────────────────────────

    @Test
    void getInspectorStats_returns200() throws Exception {
        InspectorStatsResponse stats = new InspectorStatsResponse(
                5, 3, List.of(), List.of(), List.of(), List.of());
        when(polesService.getInspectorStats("insp1")).thenReturn(stats);

        mockMvc.perform(get("/poles/inspector/insp1/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAssigned").value(5))
                .andExpect(jsonPath("$.inspectedCount").value(3));
    }

    // ── GET /poles/dashboard-stats ────────────────────────────────────────────

    @Test
    void getDashboardStats_returns200() throws Exception {
        DashboardStatsResponse stats = new DashboardStatsResponse(
                10, 6, List.of(), List.of(), List.of(), List.of());
        when(polesService.getDashboardStats()).thenReturn(stats);

        mockMvc.perform(get("/poles/dashboard-stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPoles").value(10))
                .andExpect(jsonPath("$.inspectedCount").value(6));
    }

    // ── PUT /poles/{id} ───────────────────────────────────────────────────────

    @Test
    void updatePole_returns200WithUpdated() throws Exception {
        Pole updated = pole("p1");
        when(polesService.updatePole(eq("p1"), any())).thenReturn(updated);

        mockMvc.perform(put("/poles/p1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("p1"));
    }
}
