package com.aurum.api.web;

import com.aurum.api.model.Review;
import com.aurum.api.repo.ReviewRepository;
import com.aurum.api.web.Dtos.ReviewRequest;
import jakarta.validation.Valid;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    private final ReviewRepository repo;

    public ReviewController(ReviewRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Review> all() { return repo.findAllByOrderByCreatedAtDesc(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Review add(@Valid @RequestBody ReviewRequest r, Authentication auth) {
        Review v = new Review(r.name().trim(), r.treat().trim(), r.rating(), r.text().trim(),
            LocalDate.now().toString(), Instant.now());
        v.setUserId(auth.getName());
        return repo.save(v);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found.");
        }
        repo.deleteById(id);
    }
}
