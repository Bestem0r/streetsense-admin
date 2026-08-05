package com.vegobject.springboot_mongodb.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vegobject.springboot_mongodb.collection.User;
import com.vegobject.springboot_mongodb.config.SecurityConfig;
import com.vegobject.springboot_mongodb.dto.*;
import com.vegobject.springboot_mongodb.security.CustomUserDetailsService;
import com.vegobject.springboot_mongodb.security.JwtTokenProvider;
import com.vegobject.springboot_mongodb.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private AuthService authService;
    @MockitoBean private JwtTokenProvider jwtTokenProvider;
    @MockitoBean private CustomUserDetailsService customUserDetailsService;

    private AuthResponse stubAuthResponse() {
        AuthResponse r = new AuthResponse();
        r.setToken("access-token");
        r.setRefreshToken("refresh-token");
        r.setType("Bearer");
        r.setExpiresIn(86400000L);
        AuthResponse.UserDTO user = new AuthResponse.UserDTO();
        user.setUserName("alice");
        user.setEmail("alice@example.com");
        r.setUser(user);
        return r;
    }

    // ── POST /auth/register ───────────────────────────────────────────────────

    @Test
    void register_success_returns201() throws Exception {
        when(authService.register(any())).thenReturn(stubAuthResponse());

        RegisterRequest req = new RegisterRequest(
                "alice", "alice@example.com", "pass", "pass", "Alice", "Smith", "123");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("access-token"));
    }

    @Test
    void register_failure_returns400() throws Exception {
        when(authService.register(any())).thenThrow(new Exception("Email is already registered"));

        RegisterRequest req = new RegisterRequest(
                "alice", "dup@example.com", "pass", "pass", "Alice", "Smith", "123");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Email is already registered"));
    }

    // ── POST /auth/login ──────────────────────────────────────────────────────

    @Test
    void login_success_returns200() throws Exception {
        when(authService.login(any())).thenReturn(stubAuthResponse());

        LoginRequest req = new LoginRequest("alice", "pass", false);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Login successful"));
    }

    @Test
    void login_failure_returns401() throws Exception {
        when(authService.login(any())).thenThrow(new Exception("Invalid username or password"));

        LoginRequest req = new LoginRequest("alice", "wrong", false);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── GET /auth/me ──────────────────────────────────────────────────────────

    @Test
    @WithMockUser
    void getCurrentUser_authenticated_returns200() throws Exception {
        User user = new User();
        user.setUserName("alice");
        when(authService.getCurrentUser()).thenReturn(user);

        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser
    void getCurrentUser_serviceThrows_returns404() throws Exception {
        when(authService.getCurrentUser()).thenThrow(new Exception("User not found"));

        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── POST /auth/forgot-password ────────────────────────────────────────────

    @Test
    void forgotPassword_returns200() throws Exception {
        doNothing().when(authService).forgotPassword(anyString());

        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("alice@example.com");

        mockMvc.perform(post("/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void forgotPassword_serviceThrows_returns400() throws Exception {
        doThrow(new Exception("Send failed")).when(authService).forgotPassword(anyString());

        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("alice@example.com");

        mockMvc.perform(post("/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── POST /auth/reset-password ─────────────────────────────────────────────

    @Test
    void resetPassword_success_returns200() throws Exception {
        doNothing().when(authService).resetPassword(anyString(), anyString(), anyString());

        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken("tok");
        req.setNewPassword("newpass");
        req.setConfirmPassword("newpass");

        mockMvc.perform(post("/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void resetPassword_failure_returns400() throws Exception {
        doThrow(new Exception("Invalid token")).when(authService)
                .resetPassword(anyString(), anyString(), anyString());

        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken("bad");
        req.setNewPassword("p");
        req.setConfirmPassword("p");

        mockMvc.perform(post("/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── POST /auth/change-password ────────────────────────────────────────────

    @Test
    @WithMockUser
    void changePassword_success_returns200() throws Exception {
        doNothing().when(authService).changePassword(any());

        ChangePasswordRequest req = new ChangePasswordRequest("old", "new", "new");

        mockMvc.perform(post("/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser
    void changePassword_failure_returns400() throws Exception {
        doThrow(new Exception("Old password is incorrect")).when(authService).changePassword(any());

        ChangePasswordRequest req = new ChangePasswordRequest("wrong", "new", "new");

        mockMvc.perform(post("/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── PUT /auth/profile ─────────────────────────────────────────────────────

    @Test
    @WithMockUser
    void updateProfile_success_returns200() throws Exception {
        User updated = new User();
        updated.setFirstName("Alicia");
        when(authService.updateProfile(any())).thenReturn(updated);

        mockMvc.perform(put("/auth/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser
    void updateProfile_failure_returns400() throws Exception {
        when(authService.updateProfile(any())).thenThrow(new Exception("Update failed"));

        mockMvc.perform(put("/auth/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new User())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── POST /auth/logout ─────────────────────────────────────────────────────

    @Test
    void logout_returns200() throws Exception {
        doNothing().when(authService).logout();

        mockMvc.perform(post("/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // ── POST /auth/refresh-token ──────────────────────────────────────────────

    @Test
    void refreshToken_success_returns200() throws Exception {
        when(authService.refreshToken(anyString())).thenReturn(stubAuthResponse());

        RefreshTokenRequest req = new RefreshTokenRequest();
        req.setRefreshToken("old-refresh");

        mockMvc.perform(post("/auth/refresh-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void refreshToken_invalid_returns401() throws Exception {
        when(authService.refreshToken(anyString())).thenThrow(new Exception("Invalid token"));

        RefreshTokenRequest req = new RefreshTokenRequest();
        req.setRefreshToken("bad");

        mockMvc.perform(post("/auth/refresh-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }
}
