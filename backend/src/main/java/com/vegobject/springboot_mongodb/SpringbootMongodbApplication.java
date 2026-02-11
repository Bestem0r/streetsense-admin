package com.vegobject.springboot_mongodb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.CrossOrigin;

// import org.springframework.context.annotation.ComponentScan;
// import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "http://dt10.idi.ntnu.no")
@SpringBootApplication
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
