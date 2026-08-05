package com.vegobject.springboot_mongodb.service;

import com.vegobject.springboot_mongodb.collection.Capture;
import com.vegobject.springboot_mongodb.repository.CaptureRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlanCaptureServiceTest {

    @Mock private CaptureRepository captureRepository;
    @Mock private NotificationService notificationService;
    @InjectMocks private PlanCaptureService planCaptureService;

    private Capture capture(String id, List<String> poles) {
        return Capture.builder()
                .id(id)
                .poles(poles != null ? poles : new ArrayList<>())
                .build();
    }

    @Test
    void addCaptureRound_savesAndCreatesNotification() {
        Capture input = capture(null, List.of("p1", "p2"));
        Capture saved = capture("cap1", List.of("p1", "p2"));
        when(captureRepository.save(input)).thenReturn(saved);

        Capture result = planCaptureService.addCaptureRound(input);

        assertEquals("cap1", result.getId());
        verify(notificationService).createCaptureNotification("cap1", "planned-capture", "info", 2);
    }

    @Test
    void addCaptureRound_nullId_skipsNotification() {
        Capture input = capture(null, List.of("p1"));
        when(captureRepository.save(input)).thenReturn(capture(null, List.of("p1")));

        planCaptureService.addCaptureRound(input);

        verify(notificationService, never()).createCaptureNotification(any(), any(), any(), anyInt());
    }

    @Test
    void addCaptureRound_nullPoles_notificationWithZeroCount() {
        Capture input = Capture.builder().build();
        Capture saved = Capture.builder().id("cap2").build();
        when(captureRepository.save(input)).thenReturn(saved);

        planCaptureService.addCaptureRound(input);

        verify(notificationService).createCaptureNotification("cap2", "planned-capture", "info", 0);
    }

    @Test
    void addCaptureRound_notificationServiceThrows_stillReturnsSaved() {
        Capture input = capture(null, List.of("p1"));
        Capture saved = capture("cap3", List.of("p1"));
        when(captureRepository.save(input)).thenReturn(saved);
        doThrow(new RuntimeException("notify fail"))
                .when(notificationService).createCaptureNotification(any(), any(), any(), anyInt());

        Capture result = planCaptureService.addCaptureRound(input);

        assertEquals("cap3", result.getId());
    }

    @Test
    void getCaptures_returnsList() {
        when(captureRepository.findAll()).thenReturn(List.of(capture("c1", null)));
        assertEquals(1, planCaptureService.getCaptures().size());
    }

    @Test
    void getCaptureById_found_returnsOptional() {
        when(captureRepository.findById("c1")).thenReturn(Optional.of(capture("c1", null)));
        assertTrue(planCaptureService.getCaptureById("c1").isPresent());
    }

    @Test
    void getCaptureById_notFound_returnsEmpty() {
        when(captureRepository.findById("x")).thenReturn(Optional.empty());
        assertTrue(planCaptureService.getCaptureById("x").isEmpty());
    }

    @Test
    void getCapturesByDateRange_delegatesRepository() {
        when(captureRepository.findByDateRange(100L, 200L)).thenReturn(List.of());
        planCaptureService.getCapturesByDateRange(100L, 200L);
        verify(captureRepository).findByDateRange(100L, 200L);
    }

    @Test
    void deleteCapture_delegatesRepository() {
        planCaptureService.deleteCapture("c1");
        verify(captureRepository).deleteById("c1");
    }

    @Test
    void updateCapture_setsIdAndSaves() {
        Capture update = capture(null, List.of("p1"));
        Capture saved = capture("c1", List.of("p1"));
        when(captureRepository.save(update)).thenReturn(saved);

        Capture result = planCaptureService.updateCapture("c1", update);

        assertEquals("c1", update.getId());
        assertEquals("c1", result.getId());
        verify(captureRepository).save(update);
    }
}
