package com.vegobject.springboot_mongodb.service;

import com.vegobject.springboot_mongodb.collection.User;
import com.vegobject.springboot_mongodb.dto.AuthResponse;
import com.vegobject.springboot_mongodb.dto.ChangePasswordRequest;
import com.vegobject.springboot_mongodb.dto.LoginRequest;
import com.vegobject.springboot_mongodb.dto.RegisterRequest;
import com.vegobject.springboot_mongodb.repository.UserRepository;
import com.vegobject.springboot_mongodb.security.JwtTokenProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private EmailService emailService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtTokenProvider tokenProvider;

    @InjectMocks private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "frontendUrl", "http://localhost:4200");

        sampleUser = new User();
        sampleUser.setId("user1");
        sampleUser.setUserName("alice");
        sampleUser.setEmail("alice@example.com");
        sampleUser.setFirstName("Alice");
        sampleUser.setLastName("Smith");
        sampleUser.setPhone("12345678");
        sampleUser.setPassword("encoded_password");
        sampleUser.setRole("USER");
        sampleUser.setEnabled(true);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ── register ──────────────────────────────────────────────────────────────

    @Test
    void register_passwordMismatch_throwsException() {
        RegisterRequest req = new RegisterRequest(
                "alice", "alice@example.com", "pass1", "pass2", "Alice", "Smith", "123");
        assertThrows(Exception.class, () -> authService.register(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_duplicateEmail_throwsException() {
        RegisterRequest req = new RegisterRequest(
                "alice", "alice@example.com", "pass", "pass", "Alice", "Smith", "123");
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);
        assertThrows(Exception.class, () -> authService.register(req));
    }

    @Test
    void register_duplicateUsername_throwsException() {
        RegisterRequest req = new RegisterRequest(
                "alice", "alice@example.com", "pass", "pass", "Alice", "Smith", "123");
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUserName("alice")).thenReturn(true);
        assertThrows(Exception.class, () -> authService.register(req));
    }

    @Test
    void register_success_returnsAuthResponse() throws Exception {
        RegisterRequest req = new RegisterRequest(
                "alice", "alice@example.com", "pass", "pass", "Alice", "Smith", "123");
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUserName(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(tokenProvider.generateToken("alice")).thenReturn("access-token");
        when(tokenProvider.generateRefreshToken("alice")).thenReturn("refresh-token");
        when(tokenProvider.getExpirationTime()).thenReturn(86400000L);

        AuthResponse response = authService.register(req);

        assertNotNull(response);
        assertEquals("access-token", response.getToken());
        assertEquals("refresh-token", response.getRefreshToken());
        assertEquals("Bearer", response.getType());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_setsRoleAndEnabledAndStatus() throws Exception {
        RegisterRequest req = new RegisterRequest(
                "alice", "alice@example.com", "pass", "pass", "Alice", "Smith", "123");
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUserName(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(tokenProvider.generateToken(anyString())).thenReturn("tok");
        when(tokenProvider.generateRefreshToken(anyString())).thenReturn("ref");
        when(tokenProvider.getExpirationTime()).thenReturn(86400000L);

        authService.register(req);

        verify(userRepository).save(argThat(u ->
                "USER".equals(u.getRole()) && u.isEnabled() && "ACTIVE".equals(u.getStatus())));
    }

    // ── login ─────────────────────────────────────────────────────────────────

    @Test
    void login_success_rememberMeFalse_usesDefaultExpiry() throws Exception {
        Authentication auth = mock(Authentication.class);
        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(userRepository.findByUserName("alice")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any())).thenReturn(sampleUser);
        when(tokenProvider.generateToken("alice")).thenReturn("token");
        when(tokenProvider.generateRefreshToken("alice")).thenReturn("refresh");
        when(tokenProvider.getExpirationTime()).thenReturn(86400000L);

        AuthResponse response = authService.login(new LoginRequest("alice", "pass", false));

        assertEquals("token", response.getToken());
        verify(tokenProvider).generateToken("alice");
        verify(tokenProvider, never()).generateTokenWithExpiration(any(), anyLong());
    }

    @Test
    void login_success_rememberMeTrue_usesExtendedExpiry() throws Exception {
        Authentication auth = mock(Authentication.class);
        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(userRepository.findByUserName("alice")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any())).thenReturn(sampleUser);
        when(tokenProvider.generateTokenWithExpiration(eq("alice"), anyLong())).thenReturn("long-token");
        when(tokenProvider.generateRefreshTokenWithExpiration(eq("alice"), anyLong())).thenReturn("long-refresh");
        when(tokenProvider.getExpirationTime()).thenReturn(86400000L);

        AuthResponse response = authService.login(new LoginRequest("alice", "pass", true));

        assertNotNull(response);
        verify(tokenProvider).generateTokenWithExpiration(eq("alice"), anyLong());
        verify(tokenProvider, never()).generateToken(anyString());
    }

    @Test
    void login_authFails_throwsException() {
        when(authenticationManager.authenticate(any())).thenThrow(new RuntimeException("Bad credentials"));
        assertThrows(Exception.class, () -> authService.login(new LoginRequest("alice", "wrong", false)));
    }

    // ── getCurrentUser ────────────────────────────────────────────────────────

    @Test
    void getCurrentUser_returnsUser() throws Exception {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("alice");
        SecurityContextHolder.getContext().setAuthentication(auth);
        when(userRepository.findByUserName("alice")).thenReturn(Optional.of(sampleUser));

        User result = authService.getCurrentUser();
        assertEquals("alice", result.getUserName());
    }

    @Test
    void getCurrentUser_userNotFound_throwsException() {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("ghost");
        SecurityContextHolder.getContext().setAuthentication(auth);
        when(userRepository.findByUserName("ghost")).thenReturn(Optional.empty());

        assertThrows(Exception.class, () -> authService.getCurrentUser());
    }

    // ── changePassword ────────────────────────────────────────────────────────

    @Test
    void changePassword_passwordsMismatch_throwsException() {
        ChangePasswordRequest req = new ChangePasswordRequest("old", "new1", "new2");
        assertThrows(Exception.class, () -> authService.changePassword(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    void changePassword_wrongOldPassword_throwsException() {
        ChangePasswordRequest req = new ChangePasswordRequest("wrong", "newpass", "newpass");
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("alice");
        SecurityContextHolder.getContext().setAuthentication(auth);
        when(userRepository.findByUserName("alice")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrong", "encoded_password")).thenReturn(false);

        assertThrows(Exception.class, () -> authService.changePassword(req));
    }

    @Test
    void changePassword_success_savesNewPassword() throws Exception {
        ChangePasswordRequest req = new ChangePasswordRequest("old", "newpass", "newpass");
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("alice");
        SecurityContextHolder.getContext().setAuthentication(auth);
        when(userRepository.findByUserName("alice")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("old", "encoded_password")).thenReturn(true);
        when(passwordEncoder.encode("newpass")).thenReturn("encoded_new");
        when(userRepository.save(any())).thenReturn(sampleUser);

        authService.changePassword(req);

        verify(userRepository).save(argThat(u -> "encoded_new".equals(u.getPassword())));
    }

    // ── forgotPassword ────────────────────────────────────────────────────────

    @Test
    void forgotPassword_userNotFound_noEmailSent() throws Exception {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());
        authService.forgotPassword("unknown@example.com");
        verify(emailService, never()).sendEmail(any(), any(), any());
    }

    @Test
    void forgotPassword_userFound_savesTokenAndSendsEmail() throws Exception {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        authService.forgotPassword("alice@example.com");

        verify(userRepository).save(argThat(u -> u.getResetToken() != null && u.getResetTokenExpiry() != null));
        verify(emailService).sendEmail(eq("alice@example.com"), anyString(), anyString());
    }

    @Test
    void forgotPassword_resetLinkContainsFrontendUrl() throws Exception {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any())).thenReturn(sampleUser);

        authService.forgotPassword("alice@example.com");

        verify(emailService).sendEmail(any(), any(), argThat(body -> body.contains("http://localhost:4200")));
    }

    // ── resetPassword ─────────────────────────────────────────────────────────

    @Test
    void resetPassword_passwordsMismatch_throwsException() {
        assertThrows(Exception.class, () -> authService.resetPassword("tok", "a", "b"));
    }

    @Test
    void resetPassword_invalidToken_throwsException() {
        when(userRepository.findByResetToken("bad-token")).thenReturn(Optional.empty());
        assertThrows(Exception.class, () -> authService.resetPassword("bad-token", "pass", "pass"));
    }

    @Test
    void resetPassword_expiredToken_throwsException() {
        sampleUser.setResetToken("tok");
        sampleUser.setResetTokenExpiry(LocalDateTime.now().minusMinutes(1));
        when(userRepository.findByResetToken("tok")).thenReturn(Optional.of(sampleUser));
        assertThrows(Exception.class, () -> authService.resetPassword("tok", "pass", "pass"));
    }

    @Test
    void resetPassword_nullExpiry_throwsException() {
        sampleUser.setResetToken("tok");
        sampleUser.setResetTokenExpiry(null);
        when(userRepository.findByResetToken("tok")).thenReturn(Optional.of(sampleUser));
        assertThrows(Exception.class, () -> authService.resetPassword("tok", "pass", "pass"));
    }

    @Test
    void resetPassword_success_clearsTokenAndSaves() throws Exception {
        sampleUser.setResetToken("tok");
        sampleUser.setResetTokenExpiry(LocalDateTime.now().plusMinutes(10));
        when(userRepository.findByResetToken("tok")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.encode("newpass")).thenReturn("enc");
        when(userRepository.save(any())).thenReturn(sampleUser);

        authService.resetPassword("tok", "newpass", "newpass");

        verify(userRepository).save(argThat(u -> u.getResetToken() == null && u.getResetTokenExpiry() == null));
    }

    // ── logout ────────────────────────────────────────────────────────────────

    @Test
    void logout_clearsSecurityContext() {
        Authentication auth = mock(Authentication.class);
        SecurityContextHolder.getContext().setAuthentication(auth);
        authService.logout();
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    // ── refreshToken ──────────────────────────────────────────────────────────

    @Test
    void refreshToken_invalidToken_throwsException() {
        when(tokenProvider.validateToken("bad")).thenReturn(false);
        assertThrows(Exception.class, () -> authService.refreshToken("bad"));
    }

    @Test
    void refreshToken_nullUsername_throwsException() {
        when(tokenProvider.validateToken("tok")).thenReturn(true);
        when(tokenProvider.getUsernameFromToken("tok")).thenReturn(null);
        assertThrows(Exception.class, () -> authService.refreshToken("tok"));
    }

    @Test
    void refreshToken_userNotFound_throwsException() {
        when(tokenProvider.validateToken("tok")).thenReturn(true);
        when(tokenProvider.getUsernameFromToken("tok")).thenReturn("ghost");
        when(userRepository.findByUserName("ghost")).thenReturn(Optional.empty());
        assertThrows(Exception.class, () -> authService.refreshToken("tok"));
    }

    @Test
    void refreshToken_success_returnsNewTokens() throws Exception {
        when(tokenProvider.validateToken("old-refresh")).thenReturn(true);
        when(tokenProvider.getUsernameFromToken("old-refresh")).thenReturn("alice");
        when(userRepository.findByUserName("alice")).thenReturn(Optional.of(sampleUser));
        when(tokenProvider.generateToken("alice")).thenReturn("new-access");
        when(tokenProvider.generateRefreshToken("alice")).thenReturn("new-refresh");
        when(tokenProvider.getExpirationTime()).thenReturn(86400000L);

        AuthResponse response = authService.refreshToken("old-refresh");

        assertEquals("new-access", response.getToken());
        assertEquals("new-refresh", response.getRefreshToken());
    }

    // ── updateProfile ─────────────────────────────────────────────────────────

    @Test
    void updateProfile_updatesOnlyNonNullFields() throws Exception {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("alice");
        SecurityContextHolder.getContext().setAuthentication(auth);
        when(userRepository.findByUserName("alice")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any())).thenReturn(sampleUser);

        User updateReq = new User();
        updateReq.setFirstName("Alicia");

        authService.updateProfile(updateReq);

        verify(userRepository).save(argThat(u ->
                "Alicia".equals(u.getFirstName()) && "Smith".equals(u.getLastName())));
    }

    @Test
    void updateProfile_allFieldsNull_keepsExistingValues() throws Exception {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("alice");
        SecurityContextHolder.getContext().setAuthentication(auth);
        when(userRepository.findByUserName("alice")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any())).thenReturn(sampleUser);

        authService.updateProfile(new User());

        verify(userRepository).save(argThat(u ->
                "Alice".equals(u.getFirstName()) && "Smith".equals(u.getLastName())));
    }
}
