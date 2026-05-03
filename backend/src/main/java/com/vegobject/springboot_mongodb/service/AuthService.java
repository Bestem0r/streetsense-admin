package com.vegobject.springboot_mongodb.service;

import com.vegobject.springboot_mongodb.collection.User;
import com.vegobject.springboot_mongodb.dto.AuthResponse;
import com.vegobject.springboot_mongodb.dto.ChangePasswordRequest;
import com.vegobject.springboot_mongodb.dto.LoginRequest;
import com.vegobject.springboot_mongodb.dto.RegisterRequest;
import com.vegobject.springboot_mongodb.repository.UserRepository;
import com.vegobject.springboot_mongodb.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.UUID;
@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Value("${app.frontendUrl:http://localhost:4200}")
    private String frontendUrl;

    public AuthResponse register(RegisterRequest request) throws Exception {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new Exception("Passwords do not match");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new Exception("Email is already registered");
        }

 
        if (userRepository.existsByUserName(request.getUserName())) {
            throw new Exception("Username is already taken");
        }

        User user = new User();
        user.setUserName(request.getUserName().trim());
        user.setEmail(request.getEmail().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setPhone(request.getPhoneNumber().trim());
        user.setRole("USER");
        user.setEnabled(true);
        user.setStatus("ACTIVE");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        String token = tokenProvider.generateToken(savedUser.getUserName());
        String refreshToken = tokenProvider.generateRefreshToken(savedUser.getUserName());

        return createAuthResponse(token, refreshToken, savedUser);
    }


    public AuthResponse login(LoginRequest request) throws Exception {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUserName(),
                            request.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            User user = userRepository.findByUserName(request.getUserName())
                    .orElseThrow(() -> new Exception("User not found"));

            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
            String token;
            String refreshToken;
            
            if (request.isRememberMe()) {
                
                token = tokenProvider.generateTokenWithExpiration(user.getUserName(), 30L * 24 * 60 * 60 * 1000);
                refreshToken = tokenProvider.generateRefreshTokenWithExpiration(user.getUserName(), 30L * 24 * 60 * 60 * 1000);
            } else {
                
                token = tokenProvider.generateToken(user.getUserName());
                refreshToken = tokenProvider.generateRefreshToken(user.getUserName());
            }

            return createAuthResponse(token, refreshToken, user);

        } catch (Exception e) {
            throw new Exception("Invalid username or password");
        }
    }

   
    public User getCurrentUser() throws Exception {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUserName(username)
                .orElseThrow(() -> new Exception("User not found"));
    }

    public void changePassword(ChangePasswordRequest request) throws Exception {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new Exception("New passwords do not match");
        }

        User user = getCurrentUser();

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new Exception("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public void forgotPassword(String email) throws Exception {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            // Don't reveal whether the email is registered
            return;
        }

        try {
            String resetToken = UUID.randomUUID().toString();
            user.setResetToken(resetToken);
            user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
            userRepository.save(user);

            String baseUrl = (frontendUrl != null) ? frontendUrl : "http://localhost:4200";
            String resetLink = baseUrl + "/reset-password?token=" + resetToken;

            emailService.sendEmail(
                user.getEmail(),
                "Reset your password",
                "<p>Click the link below to reset your password:</p>" +
                "<a href=\"" + resetLink + "\">Reset Password</a>" +
                "<p>This link expires in 15 minutes.</p>"
            );
        } catch (Exception e) {
            throw new Exception("Failed to send password reset email: " + e.getMessage());
        }
    }

    public void resetPassword(String token, String newPassword, String confirmPassword) throws Exception {
        if (!newPassword.equals(confirmPassword)) {
            throw new Exception("Passwords do not match");
        }

        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new Exception("Invalid or expired reset token"));

        // Check if token has expired
        if (user.getResetTokenExpiry() == null || LocalDateTime.now().isAfter(user.getResetTokenExpiry())) {
            throw new Exception("Reset token has expired. Please request a new password reset.");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public void logout() {
        SecurityContextHolder.clearContext();
    }

    /**
     * Refresh access token using refresh token
     * @param refreshToken The refresh token provided by the client
     * @return AuthResponse with new access token
     * @throws Exception if refresh token is invalid or expired
     */
    public AuthResponse refreshToken(String refreshToken) throws Exception {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new Exception("Invalid or expired refresh token");
        }

        String username = tokenProvider.getUsernameFromToken(refreshToken);
        if (username == null) {
            throw new Exception("Could not extract username from refresh token");
        }

        User user = userRepository.findByUserName(username)
                .orElseThrow(() -> new Exception("User not found"));

        String newToken = tokenProvider.generateToken(user.getUserName());
        String newRefreshToken = tokenProvider.generateRefreshToken(user.getUserName());

        return createAuthResponse(newToken, newRefreshToken, user);
    }

    /**
     * Update user profile 
     * @param updateRequest User object with updated fields (only non-null fields will be updated)
     * @return Updated user
     * @throws Exception if user not found or validation fails
     */
    public User updateProfile(User updateRequest) throws Exception {
        User user = getCurrentUser();
        
        if (updateRequest.getFirstName() != null) {
            user.setFirstName(updateRequest.getFirstName());
        }
        if (updateRequest.getLastName() != null) {
            user.setLastName(updateRequest.getLastName());
        }
        if (updateRequest.getPhone() != null) {
            user.setPhone(updateRequest.getPhone());
        }
        if (updateRequest.getProfileImage() != null) {
            user.setProfileImage(updateRequest.getProfileImage());
        }
        if (updateRequest.getBio() != null) {
            user.setBio(updateRequest.getBio());
        }

        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    /**
     * Helper method to create AuthResponse from user and tokens. 
     * @param token JWT access token
     * @param refreshToken JWT refresh token
     * @param user User object to extract user details
     * @return AuthResponse containing token, refresh token, and user details
     */
    private AuthResponse createAuthResponse(String token, String refreshToken, User user) {
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setRefreshToken(refreshToken);
        response.setType("Bearer");
        response.setExpiresIn(tokenProvider.getExpirationTime());

        AuthResponse.UserDTO userDTO = new AuthResponse.UserDTO();
        userDTO.setId(user.getId());
        userDTO.setUserName(user.getUserName());
        userDTO.setEmail(user.getEmail());
        userDTO.setFirstName(user.getFirstName());
        userDTO.setLastName(user.getLastName());
        userDTO.setPhoneNumber(user.getPhone());
        userDTO.setRole(user.getRole());
        userDTO.setProfileImage(user.getProfileImage());
        userDTO.setCreatedAt(user.getCreatedAt());

        response.setUser(userDTO);
        return response;
    }
}
