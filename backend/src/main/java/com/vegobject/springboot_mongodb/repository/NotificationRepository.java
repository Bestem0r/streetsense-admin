package com.vegobject.springboot_mongodb.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.vegobject.springboot_mongodb.collection.Notification;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
  void deleteByType(String type);
}
