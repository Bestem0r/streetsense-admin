package com.vegobject.springboot_mongodb.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String refreshToken;
    private String type = "Bearer";
    private Long expiresIn;
    private UserDTO user;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDTO {
        private String id;
        private String username;
        private String email;
        private String firstName;
        private String lastName;
        private String phoneNumber;
        private String role;
        private String profileImage;
        private LocalDateTime createdAt;
    }
}
