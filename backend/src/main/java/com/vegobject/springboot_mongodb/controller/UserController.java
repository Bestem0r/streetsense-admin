package com.vegobject.springboot_mongodb.controller;

import com.vegobject.springboot_mongodb.dto.ApiResponse;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = {
    "http://localhost:4200",
    "http://localhost:8080",
    "http://dt10.idi.ntnu.no",
    "http://dt14.idi.ntnu.no:8080"
})
public class UserController {

    @Autowired
    private MongoTemplate mongoTemplate;

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        try {
            List<Document> raw = mongoTemplate
                .getCollection("users")
                .find()
                .into(new ArrayList<>());

            List<Document> users = new ArrayList<>();
            for (Document doc : raw) {
                Document out = new Document();


                Object rawId = doc.get("_id");
                if (rawId instanceof ObjectId) {
                    out.put("id", ((ObjectId) rawId).toHexString());
                } else if (rawId != null) {
                    out.put("id", rawId.toString());
                }
                String userName = doc.getString("userName");
                out.put("userName", userName);

                out.put("firstName", doc.get("firstName"));
                out.put("lastName",  doc.get("lastName"));
                out.put("email",     doc.get("email"));
                out.put("phone",     doc.get("phone"));
                out.put("county",    doc.get("county"));
                out.put("role",      doc.get("role"));
                out.put("status",    doc.get("status"));
                out.put("createdAt", doc.get("createdAt"));

                users.add(out);
            }

            return new ResponseEntity<>(
                new ApiResponse(true, "Users retrieved successfully", users),
                HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                new ApiResponse(false, e.getMessage()),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            ObjectId objectId = new ObjectId(id);
            Document deleted = mongoTemplate
                .getCollection("users")
                .findOneAndDelete(new Document("_id", objectId));

            if (deleted == null) {
                return new ResponseEntity<>(
                    new ApiResponse(false, "User not found"),
                    HttpStatus.NOT_FOUND
                );
            }
            return new ResponseEntity<>(
                new ApiResponse(true, "User deleted successfully"),
                HttpStatus.OK
            );
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                new ApiResponse(false, "Invalid user ID format"),
                HttpStatus.BAD_REQUEST
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                new ApiResponse(false, e.getMessage()),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
            
}
