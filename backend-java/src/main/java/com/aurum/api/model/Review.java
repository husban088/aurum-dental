package com.aurum.api.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("reviews")
public class Review {
    @Id
    private String id;
    private String name;
    private String treat;
    private int rating;
    private String text;
    private String date;   // yyyy-MM-dd
    private String userId;
    private Instant createdAt = Instant.now();

    public Review() { }

    public Review(String name, String treat, int rating, String text, String date, Instant createdAt) {
        this.name = name; this.treat = treat; this.rating = rating; this.text = text;
        this.date = date; this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTreat() { return treat; }
    public void setTreat(String treat) { this.treat = treat; }
    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
