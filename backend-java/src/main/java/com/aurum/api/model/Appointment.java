package com.aurum.api.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("appointments")
public class Appointment {
    @Id
    private String id;
    private String name;
    private String phone;
    private String service;
    private String doctor;
    private String date;   // yyyy-MM-dd
    private String time;   // e.g. 11:00 AM
    private String status = "Pending";
    private String note;
    private String userId;
    private Instant createdAt = Instant.now();

    public Appointment() { }

    public Appointment(String name, String phone, String service, String doctor,
                       String date, String time, String status) {
        this.name = name; this.phone = phone; this.service = service; this.doctor = doctor;
        this.date = date; this.time = time; this.status = status;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getService() { return service; }
    public void setService(String service) { this.service = service; }
    public String getDoctor() { return doctor; }
    public void setDoctor(String doctor) { this.doctor = doctor; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
