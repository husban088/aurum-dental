package com.aurum.api.repo;

import com.aurum.api.model.Review;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ReviewRepository extends MongoRepository<Review, String> {
    List<Review> findAllByOrderByCreatedAtDesc();
    void deleteByUserId(String userId);
}