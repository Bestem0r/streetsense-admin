package com.vegobject.springboot_mongodb.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {
    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${app.jwtSecret:mySecretKeyForJWTTokenGenerationAndValidationPurpose123456}")
    private String jwtSecret;

    @Value("${app.jwtExpirationMs:86400000}")
    private long jwtExpirationMs;

    @Value("${app.jwtRefreshExpirationMs:604800000}")
    private long refreshTokenExpirationMs;

    /**
     * Retrieves the signing key for JWT token generation and validation.
     * @return The SecretKey used for signing JWT tokens
     */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    /**
     * Generates a JWT token for the given username with the default expiration time.
     * @param username The username for which the token is generated
     * @return The generated JWT token
     */
    public String generateToken(String username) {
        return createToken(username, jwtExpirationMs);
    }

    /**
     * Generates a JWT token for the given username with a custom expiration time.
     * @param username The username for which the token is generated
     * @param expirationMs The expiration time for the token in milliseconds
     * @return The generated JWT token
     */
    public String generateTokenWithExpiration(String username, long expirationMs) {
        return createToken(username, expirationMs);
    }

    /**
     * Generates a refresh token for the given username.
     * @param username The username for which the token is generated
     * @return The generated refresh token
     */
    public String generateRefreshToken(String username) {
        return createToken(username, refreshTokenExpirationMs);
    }

    /**
     * Generates a refresh token for the given username with a custom expiration time.
     * @param username The username for which the token is generated
     * @param expirationMs The expiration time for the token in milliseconds
     * @return The generated refresh token
     */
    public String generateRefreshTokenWithExpiration(String username, long expirationMs) {
        return createToken(username, expirationMs);
    }


    /**
     * Creates a JWT token with the specified username and expiration time.
     * @param username The username for which the token is generated
     * @param expirationMs The expiration time for the token in milliseconds
     * @return The generated JWT token
     */
    private String createToken(String username, long expirationMs) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Extracts the username from the given JWT token. If the token is invalid or expired, it returns null.
     * @param token The JWT token from which to extract the username
     * @return The username if the token is valid, otherwise null
     */
    public String getUsernameFromToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getSubject();
        } catch (SecurityException ex) {
            logger.error("Invalid JWT signature", ex);
        } catch (MalformedJwtException ex) {
            logger.error("Invalid JWT token", ex);
        } catch (ExpiredJwtException ex) {
            logger.error("Expired JWT token", ex);
        } catch (UnsupportedJwtException ex) {
            logger.error("Unsupported JWT token", ex);
        } catch (IllegalArgumentException ex) {
            logger.error("JWT claims string is empty", ex);
        }
        return null;
    }

    /**
     * Validates the given JWT token by checking its signature, structure, and expiration.
     * @param token The JWT token to validate
     * @return true if the token is valid, false otherwise
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (SecurityException ex) {
            logger.error("Invalid JWT signature: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            logger.error("Invalid JWT token: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            logger.error("Expired JWT token: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            logger.error("Unsupported JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            logger.error("JWT claims string is empty: {}", ex.getMessage());
        }
        return false;
    }

    public long getExpirationTime() {
        return jwtExpirationMs;
    }
}
