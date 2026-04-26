package com.vegobject.springboot_mongodb.controller;

import com.vegobject.springboot_mongodb.collection.User;
import com.vegobject.springboot_mongodb.dto.*;
import com.vegobject.springboot_mongodb.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return new ResponseEntity<>(
                    new ApiResponse(true, "User registered successfully", response),
                    HttpStatus.CREATED
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new ApiResponse(false, e.getMessage()),
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Login endpoint
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return new ResponseEntity<>(
                    new ApiResponse(true, "Login successful", response),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new ApiResponse(false, e.getMessage()),
                    HttpStatus.UNAUTHORIZED
            );
        }
    }

    /**
     * Get current user endpoint
     * GET /api/auth/me
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getCurrentUser() {
        try {
            User user = authService.getCurrentUser();
            return new ResponseEntity<>(
                    new ApiResponse(true, "User retrieved successfully", user),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new ApiResponse(false, e.getMessage()),
                    HttpStatus.NOT_FOUND
            );
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            authService.forgotPassword(request.getEmail());
            return new ResponseEntity<>(
                    new ApiResponse(true, "Password reset email sent"),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new ApiResponse(false, e.getMessage()),
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getToken(), request.getNewPassword(), request.getConfirmPassword());
            return new ResponseEntity<>(
                    new ApiResponse(true, "Password reset successfully"),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new ApiResponse(false, e.getMessage()),
                    HttpStatus.BAD_REQUEST
            );
        }
    }


    /**
     * Change password endpoint
     * POST /api/auth/change-password
     */
    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        try {
            authService.changePassword(request);
            return new ResponseEntity<>(
                    new ApiResponse(true, "Password changed successfully"),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new ApiResponse(false, e.getMessage()),
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Update profile endpoint
     * PUT /api/auth/profile
     */
    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateProfile(@RequestBody User updateRequest) {
        try {
            User updatedUser = authService.updateProfile(updateRequest);
            return new ResponseEntity<>(
                    new ApiResponse(true, "Profile updated successfully", updatedUser),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new ApiResponse(false, e.getMessage()),
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Logout endpoint
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        try {
            authService.logout();
            return new ResponseEntity<>(
                    new ApiResponse(true, "Logout successful"),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new ApiResponse(false, e.getMessage()),
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Refresh token endpoint
     * POST /api/auth/refresh-token
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody RefreshTokenRequest request) {
        try {
            AuthResponse response = authService.refreshToken(request.getRefreshToken());
            return new ResponseEntity<>(
                    new ApiResponse(true, "Token refreshed successfully", response),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new ApiResponse(false, e.getMessage()),
                    HttpStatus.UNAUTHORIZED
            );
        }
    }
}
