package com.aurum.api.repo;

import com.aurum.api.model.Appointment;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AppointmentRepository extends MongoRepository<Appointment, String> {
    List<Appointment> findByUserIdOrderByDateDescTimeDesc(String userId);
    List<Appointment> findByUserId(String userId);
    void deleteByUserId(String userId);
}