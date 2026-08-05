package com.vegobject.springboot_mongodb.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vegobject.springboot_mongodb.collection.Capture;
import com.vegobject.springboot_mongodb.config.SecurityConfig;
import com.vegobject.springboot_mongodb.security.CustomUserDetailsService;
import com.vegobject.springboot_mongodb.security.JwtTokenProvider;
import com.vegobject.springboot_mongodb.service.PlanCaptureService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CaptureController.class)
@Import(SecurityConfig.class)
class CaptureControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private PlanCaptureService planCaptureService;
    @MockitoBean private JwtTokenProvider jwtTokenProvider;
    @MockitoBean private CustomUserDetailsService customUserDetailsService;

    private Capture capture(String id) {
        return Capture.builder().id(id).poles(new ArrayList<>(List.of("p1", "p2"))).build();
    }

    // ── GET /captures ─────────────────────────────────────────────────────────

    @Test
    void getCaptures_returns200WithList() throws Exception {
        when(planCaptureService.getCaptures()).thenReturn(List.of(capture("c1"), capture("c2")));

        mockMvc.perform(get("/captures"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value("c1"));
    }

    @Test
    void getCaptures_emptyList_returns200() throws Exception {
        when(planCaptureService.getCaptures()).thenReturn(List.of());

        mockMvc.perform(get("/captures"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ── GET /captures/{id} ────────────────────────────────────────────────────

    @Test
    void getCaptureById_found_returns200() throws Exception {
        when(planCaptureService.getCaptureById("c1")).thenReturn(Optional.of(capture("c1")));

        mockMvc.perform(get("/captures/c1"))
                .andExpect(status().isOk());
    }

    @Test
    void getCaptureById_notFound_returns200WithEmptyOptional() throws Exception {
        when(planCaptureService.getCaptureById("x")).thenReturn(Optional.empty());

        mockMvc.perform(get("/captures/x"))
                .andExpect(status().isOk());
    }

    // ── GET /captures/dateRange ───────────────────────────────────────────────

    @Test
    void getCapturesByDateRange_returns200() throws Exception {
        when(planCaptureService.getCapturesByDateRange(100L, 200L))
                .thenReturn(List.of(capture("c1")));

        mockMvc.perform(get("/captures/dateRange")
                        .param("startDate", "100")
                        .param("endDate", "200"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    // ── POST /captures ────────────────────────────────────────────────────────

    @Test
    void addCapture_returns200WithSaved() throws Exception {
        Capture input = capture(null);
        Capture saved = capture("c1");
        when(planCaptureService.addCaptureRound(any())).thenReturn(saved);

        mockMvc.perform(post("/captures")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("c1"));
    }

    // ── PUT /captures/{id} ────────────────────────────────────────────────────

    @Test
    void updateCapture_returns200WithUpdated() throws Exception {
        Capture updated = capture("c1");
        when(planCaptureService.updateCapture(eq("c1"), any())).thenReturn(updated);

        mockMvc.perform(put("/captures/c1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(capture("c1"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("c1"));
    }

    // ── DELETE /captures/{id} ─────────────────────────────────────────────────

    @Test
    void deleteCapture_returns200() throws Exception {
        doNothing().when(planCaptureService).deleteCapture("c1");

        mockMvc.perform(delete("/captures/c1"))
                .andExpect(status().isOk());
    }
}
