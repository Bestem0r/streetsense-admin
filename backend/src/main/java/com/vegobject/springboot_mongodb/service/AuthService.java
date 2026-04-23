package com.vegobject.springboot_mongodb.service;

import com.vegobject.springboot_mongodb.collection.User;
import com.vegobject.springboot_mongodb.dto.AuthResponse;
import com.vegobject.springboot_mongodb.dto.ChangePasswordRequest;
import com.vegobject.springboot_mongodb.dto.LoginRequest;
import com.vegobject.springboot_mongodb.dto.RegisterRequest;
import com.vegobject.springboot_mongodb.repository.UserRepository;
import com.vegobject.springboot_mongodb.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    /**
     * Register a new user
     */
    public AuthResponse register(RegisterRequest request) throws Exception {
        

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new Exception("Passwords do not match");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new Exception("Email is already registered");
        }

 
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new Exception("Username is already taken");
        }

        User user = new User();
        user.setUsername(request.getUsername().trim());
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

        String token = tokenProvider.generateToken(savedUser.getUsername());
        String refreshToken = tokenProvider.generateRefreshToken(savedUser.getUsername());

        return createAuthResponse(token, refreshToken, savedUser);
    }

    /**
     * Login user
     */
    public AuthResponse login(LoginRequest request) throws Exception {
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );

            // Set the authentication in SecurityContext
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Get user details
            User user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new Exception("User not found"));

            if (!user.isEnabled()) {
                throw new Exception("User account is disabled");
            }

            // Update last login
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            // Generate tokens
            String token = tokenProvider.generateToken(user.getUsername());
            String refreshToken = tokenProvider.generateRefreshToken(user.getUsername());

            return createAuthResponse(token, refreshToken, user);

        } catch (Exception e) {
            throw new Exception("Invalid username or password");
        }
    }

   
    public User getCurrentUser() throws Exception {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
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

    public void logout() {
        SecurityContextHolder.clearContext();
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
     * Helper method to create AuthResponse from user and tokens
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
        userDTO.setUsername(user.getUsername());
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
