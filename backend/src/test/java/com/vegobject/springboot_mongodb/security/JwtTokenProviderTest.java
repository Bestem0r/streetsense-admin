package com.vegobject.springboot_mongodb.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;

    private static final String SECRET =
            "mySecretKeyForJWTTokenGenerationAndValidationPurpose123456";

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(tokenProvider, "jwtSecret", SECRET);
        ReflectionTestUtils.setField(tokenProvider, "jwtExpirationMs", 86400000L);
        ReflectionTestUtils.setField(tokenProvider, "refreshTokenExpirationMs", 604800000L);
    }

    @Test
    void generateToken_returnsNonNullToken() {
        String token = tokenProvider.generateToken("alice");
        assertNotNull(token);
        assertFalse(token.isBlank());
    }

    @Test
    void generateToken_validateToken_returnsTrue() {
        String token = tokenProvider.generateToken("alice");
        assertTrue(tokenProvider.validateToken(token));
    }

    @Test
    void getUsernameFromToken_returnsCorrectUsername() {
        String token = tokenProvider.generateToken("alice");
        assertEquals("alice", tokenProvider.getUsernameFromToken(token));
    }

    @Test
    void generateRefreshToken_validatesSuccessfully() {
        String token = tokenProvider.generateRefreshToken("bob");
        assertTrue(tokenProvider.validateToken(token));
    }

    @Test
    void generateRefreshToken_extractsCorrectUsername() {
        String token = tokenProvider.generateRefreshToken("bob");
        assertEquals("bob", tokenProvider.getUsernameFromToken(token));
    }

    @Test
    void generateTokenWithExpiration_customExpiry_validToken() {
        String token = tokenProvider.generateTokenWithExpiration("alice", 60000L);
        assertTrue(tokenProvider.validateToken(token));
        assertEquals("alice", tokenProvider.getUsernameFromToken(token));
    }

    @Test
    void generateRefreshTokenWithExpiration_customExpiry_validToken() {
        String token = tokenProvider.generateRefreshTokenWithExpiration("bob", 3600000L);
        assertTrue(tokenProvider.validateToken(token));
        assertEquals("bob", tokenProvider.getUsernameFromToken(token));
    }

    @Test
    void validateToken_expiredToken_returnsFalse() {
        String token = tokenProvider.generateTokenWithExpiration("alice", -1L);
        assertFalse(tokenProvider.validateToken(token));
    }

    @Test
    void getUsernameFromToken_expiredToken_returnsNull() {
        String token = tokenProvider.generateTokenWithExpiration("alice", -1L);
        assertNull(tokenProvider.getUsernameFromToken(token));
    }

    @Test
    void validateToken_malformedToken_returnsFalse() {
        assertFalse(tokenProvider.validateToken("not.a.valid.jwt"));
    }

    @Test
    void validateToken_randomString_returnsFalse() {
        assertFalse(tokenProvider.validateToken("randomgarbage"));
    }

    @Test
    void validateToken_emptyString_returnsFalse() {
        assertFalse(tokenProvider.validateToken(""));
    }

    @Test
    void getUsernameFromToken_malformedToken_returnsNull() {
        assertNull(tokenProvider.getUsernameFromToken("malformed.token.here"));
    }

    @Test
    void getExpirationTime_returnsConfiguredValue() {
        assertEquals(86400000L, tokenProvider.getExpirationTime());
    }

    @Test
    void twoTokensForSameUser_differentExpiry_areDifferent() {
        String t1 = tokenProvider.generateTokenWithExpiration("alice", 86400000L);
        String t2 = tokenProvider.generateTokenWithExpiration("alice", 172800000L);
        assertNotEquals(t1, t2);
    }
}
