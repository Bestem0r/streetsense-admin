package com.vegobject.springboot_mongodb.collection;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Document(collection = "users")
@JsonInclude(JsonInclude.Include.NON_NULL)
@AllArgsConstructor
@NoArgsConstructor
public class User {
  @Id
  private String id;
  
  @Indexed(unique = true)
  private String userName;
  
  @Indexed(unique = true)
  private String email;
  private String password;
  private String firstName;
  private String lastName;
  private String phone;
  private String county;
  private String role = "USER";
  private String status = "ACTIVE";
  private boolean enabled = true;
  private String profileImage;
  private String bio;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private LocalDateTime lastLogin;
  private String resetToken;
  private LocalDateTime resetTokenExpiry;

}
