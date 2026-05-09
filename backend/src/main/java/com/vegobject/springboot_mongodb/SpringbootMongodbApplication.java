package com.vegobject.springboot_mongodb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.bind.annotation.CrossOrigin;

@CrossOrigin(origins = "http://dt10.idi.ntnu.no")
@SpringBootApplication
@EnableScheduling
// @RestController
public class SpringbootMongodbApplication {

  public static void main(String[] args) {
    SpringApplication.run(SpringbootMongodbApplication.class, args);
  }

  // @GetMapping
  // public String SayHello() {
  // 	return "hello springboot";
  // }

}
